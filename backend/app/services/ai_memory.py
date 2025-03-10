from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from app.models.ai_memory import AIMemory
from app.utils.embeddings import generate_embedding
from app.utils.vector_search import vector_similarity_search
from pgvector.sqlalchemy import Vector
from sqlalchemy import desc, func, text
from sqlalchemy.orm import Session


def get_ai_memory(db: Session, user_id: UUID) -> Optional[AIMemory]:
    """Get AI memory for a user."""
    return db.query(AIMemory).filter(AIMemory.user_id == user_id).first()


def create_or_update_ai_memory(db: Session, user_id: UUID, summary: str, context: Optional[Dict[str, Any]] = None) -> AIMemory:
    """
    Create or update AI memory for a user.

    Args:
        db: Database session
        user_id: User ID
        summary: Summary of the interaction
        context: Additional context for the memory

    Returns:
        Created or updated AI memory
    """
    # Get existing memory if available
    memory = get_ai_memory(db, user_id)

    # Get current timestamp
    timestamp = datetime.now()
    timestamp_str = timestamp.strftime("%Y-%m-%d %H:%M:%S")

    # Format the new summary with timestamp
    formatted_summary = f"[{timestamp_str}] {summary}"

    if memory:
        # Update existing memory
        existing_summary = memory.summary

        # Append new summary to existing one with a separator
        updated_summary = f"{existing_summary}\n\n{formatted_summary}"

        # Limit the summary to the last 10,000 characters to prevent excessive growth
        if len(updated_summary) > 10000:
            # Find the first newline after the 10,000 character limit from the end
            cutoff_index = len(updated_summary) - 10000
            first_newline = updated_summary.find("\n\n", cutoff_index)
            if first_newline != -1:
                updated_summary = updated_summary[first_newline + 2 :]
            else:
                updated_summary = updated_summary[-10000:]

        memory.summary = updated_summary
        memory.last_updated = timestamp

        # Store context if provided
        if context:
            # Convert context to string and store in summary
            context_str = "\nContext: " + ", ".join([f"{k}: {v}" for k, v in context.items()])
            memory.summary = memory.summary + context_str

        # Generate new embedding for the updated summary
        memory.embedding = generate_embedding(updated_summary)

        db.add(memory)
        db.commit()
        db.refresh(memory)
        return memory
    else:
        # Create new memory
        embedding = generate_embedding(formatted_summary)

        # Add context if provided
        if context:
            # Convert context to string and append to summary
            context_str = "\nContext: " + ", ".join([f"{k}: {v}" for k, v in context.items()])
            formatted_summary = formatted_summary + context_str

        db_obj = AIMemory(
            user_id=user_id,
            summary=formatted_summary,
            last_updated=timestamp,
            embedding=embedding,
        )

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


def find_similar_memories(db: Session, query_embedding: List[float], limit: int = 10, min_similarity: float = 0.7) -> List[AIMemory]:
    """
    Find AI memories similar to the query embedding.

    Args:
        db: Database session
        query_embedding: Query embedding vector
        limit: Maximum number of results
        min_similarity: Minimum similarity threshold (0-1)

    Returns:
        List of similar AI memories
    """
    # Use the improved vector search functionality
    results = vector_similarity_search(
        db=db,
        table_name="ai_memory",
        column_name="embedding",
        query_vector=query_embedding,
        limit=limit,
        distance_type="cosine",
        max_distance=1 - min_similarity,  # Convert similarity threshold to distance threshold
    )

    # Convert results to AIMemory objects
    memories = []
    for result in results:
        # Get the memory ID
        memory_id = result.get("id")

        # Fetch the complete memory from the database
        memory = db.query(AIMemory).filter(AIMemory.id == memory_id).first()

        if memory:
            # Add similarity score
            memory.similarity = 1 - result.get("distance", 0)

            memories.append(memory)

    return memories


def get_memory_by_recency(db: Session, limit: int = 5) -> List[AIMemory]:
    """Get the most recently updated AI memories."""
    return db.query(AIMemory).order_by(desc(AIMemory.last_updated)).limit(limit).all()


def summarize_user_history(db: Session, user_id: UUID) -> str:
    """Generate a summary of a user's interaction history."""
    memory = get_ai_memory(db, user_id)
    if not memory:
        return "No interaction history available for this user."

    return memory.summary


def get_memory_context(db: Session, user_id: UUID, query: str) -> Dict[str, Any]:
    """
    Get relevant memory context for a user query.

    Args:
        db: Database session
        user_id: User ID
        query: User query

    Returns:
        Dictionary with memory context
    """
    # Generate embedding for the query
    query_embedding = generate_embedding(query)

    # Find similar memories
    similar_memories = find_similar_memories(db=db, query_embedding=query_embedding, limit=3, min_similarity=0.6)

    # Filter memories by user ID
    user_memories = [m for m in similar_memories if m.user_id == user_id]

    # Get the most recent memory
    recent_memory = get_ai_memory(db, user_id)

    # Combine memories into context
    context = {
        "user_id": str(user_id),
        "query": query,
        "has_memory": len(user_memories) > 0 or recent_memory is not None,
        "similar_memories": [],
        "recent_memory": None,
    }

    # Add similar memories
    for memory in user_memories:
        context["similar_memories"].append(
            {"summary": memory.summary, "last_updated": memory.last_updated.isoformat(), "similarity": getattr(memory, "similarity", 0)}
        )

    # Add recent memory
    if recent_memory:
        context["recent_memory"] = {"summary": recent_memory.summary, "last_updated": recent_memory.last_updated.isoformat()}

    return context


def extract_key_insights(db: Session, user_id: UUID) -> List[Dict[str, Any]]:
    """
    Extract key insights from a user's AI memory.

    Args:
        db: Database session
        user_id: User ID

    Returns:
        List of key insights
    """
    memory = get_ai_memory(db, user_id)
    if not memory:
        return []

    # Split memory into individual entries
    entries = memory.summary.split("\n\n")

    # Extract insights from entries
    insights = []
    for entry in entries:
        # Skip empty entries
        if not entry.strip():
            continue

        # Extract timestamp if available
        timestamp = None
        if entry.startswith("[") and "]" in entry:
            timestamp_str = entry[1 : entry.find("]")]
            try:
                timestamp = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                pass

        # Extract content
        content = entry[entry.find("]") + 1 :] if timestamp else entry
        content = content.strip()

        # Skip entries without content
        if not content:
            continue

        # Add insight
        insights.append({"timestamp": timestamp.isoformat() if timestamp else None, "content": content})

    return insights


def prune_old_memories(db: Session, older_than_days: int = 90) -> int:
    """
    Prune old AI memories.

    Args:
        db: Database session
        older_than_days: Prune memories older than this many days

    Returns:
        Number of pruned memories
    """
    cutoff_date = datetime.now() - timedelta(days=older_than_days)

    # Find memories older than the cutoff date
    old_memories = db.query(AIMemory).filter(AIMemory.last_updated < cutoff_date).all()

    # Delete old memories
    for memory in old_memories:
        db.delete(memory)

    db.commit()

    return len(old_memories)

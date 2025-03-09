from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from pgvector.sqlalchemy import Vector

from app.models.ai_memory import AIMemory
from app.utils.embeddings import generate_embedding


def get_ai_memory(db: Session, user_id: UUID) -> Optional[AIMemory]:
    """Get AI memory for a user."""
    return db.query(AIMemory).filter(AIMemory.user_id == user_id).first()


def create_or_update_ai_memory(
    db: Session, 
    user_id: UUID, 
    summary: str
) -> AIMemory:
    """Create or update AI memory for a user."""
    # Generate embedding for the summary
    embedding = generate_embedding(summary)
    
    # Check if memory exists
    db_obj = get_ai_memory(db, user_id)
    
    if db_obj:
        # Update existing memory
        db_obj.summary = summary
        db_obj.embedding = embedding
        db_obj.last_updated = datetime.utcnow()
    else:
        # Create new memory
        db_obj = AIMemory(
            user_id=user_id,
            summary=summary,
            embedding=embedding
        )
        db.add(db_obj)
    
    db.commit()
    db.refresh(db_obj)
    return db_obj


def find_similar_memories(
    db: Session,
    query_embedding: List[float],
    limit: int = 10,
    min_similarity: float = 0.7
) -> List[AIMemory]:
    """Find AI memories similar to the query embedding using vector similarity."""
    # For cosine similarity, we need to convert the threshold to a distance
    # cosine_distance = 1 - cosine_similarity
    max_distance = 1.0 - min_similarity
    
    # Query with similarity calculation and filter
    query = db.query(AIMemory).filter(
        AIMemory.embedding.cosine_distance(query_embedding) <= max_distance
    ).order_by(
        AIMemory.embedding.cosine_distance(query_embedding)
    ).limit(limit)
    
    return query.all() 
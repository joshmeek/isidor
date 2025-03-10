import os
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.models.ai_memory import AIMemory
from app.models.health_metric import HealthMetric
from app.services.ai_memory import extract_key_insights, get_ai_memory, get_memory_context
from app.services.health_metrics import find_similar_health_metrics
from app.utils.embeddings import generate_embedding
from sqlalchemy.orm import Session


def retrieve_context_for_user(
    db: Session,
    user_id: UUID,
    query: str,
    metric_types: Optional[List[str]] = None,
    max_metrics_per_type: int = 5,
    min_similarity: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.7")),
) -> Dict[str, Any]:
    """
    Retrieve relevant context for a user based on a query.

    This function implements a RAG approach by:
    1. Converting the query to an embedding
    2. Finding similar health metrics
    3. Retrieving the user's AI memory
    4. Combining these into a context object for AI processing
    """
    # Generate embedding for the query
    query_embedding = generate_embedding(query)

    # Initialize context
    context = {"query": query, "health_metrics": {}, "ai_memory": None, "memory_insights": [], "debug_info": {}}

    # Import here to avoid circular imports
    from app.services.health_metrics import find_similar_health_metrics

    # Retrieve similar health metrics for each requested metric type
    if metric_types:
        for metric_type in metric_types:
            similar_metrics = find_similar_health_metrics(
                db=db,
                user_id=user_id,
                query_embedding=query_embedding,
                metric_type=metric_type,
                limit=max_metrics_per_type,
                min_similarity=min_similarity,
            )

            # Add debug information
            context["debug_info"][f"metrics_found_{metric_type}"] = len(similar_metrics)

            # Only add to context if we have metrics
            if similar_metrics:
                context["health_metrics"][metric_type] = similar_metrics
    else:
        # If no specific metric types are requested, retrieve all types
        # Get all available metric types for this user
        available_metric_types = db.query(HealthMetric.metric_type).filter(HealthMetric.user_id == user_id).distinct().all()

        available_metric_types = [mt[0] for mt in available_metric_types]
        context["debug_info"]["available_metric_types"] = available_metric_types

        for metric_type in available_metric_types:
            similar_metrics = find_similar_health_metrics(
                db=db,
                user_id=user_id,
                query_embedding=query_embedding,
                metric_type=metric_type,
                limit=max_metrics_per_type,
                min_similarity=min_similarity,
            )

            # Add debug information
            context["debug_info"][f"metrics_found_{metric_type}"] = len(similar_metrics)

            if similar_metrics:
                context["health_metrics"][metric_type] = similar_metrics

    # Retrieve AI memory context
    memory_context = get_memory_context(db, user_id, query)
    if memory_context and memory_context.get("has_memory"):
        context["ai_memory"] = memory_context

        # Extract key insights from memory
        insights = extract_key_insights(db, user_id)
        if insights:
            # Sort insights by timestamp (newest first) and limit to 10
            # Handle case where timestamp might be None
            sorted_insights = sorted(insights, key=lambda x: x.get("timestamp", "") or "", reverse=True)[:10]
            context["memory_insights"] = sorted_insights

    return context


def format_context_for_prompt(context: Dict[str, Any]) -> str:
    """
    Format the retrieved context into a string that can be used in an AI prompt.
    """
    prompt_parts = ["# User Context\n"]

    # Add debug information if available
    if context.get("debug_info"):
        prompt_parts.append("## Debug Information\n")
        for key, value in context["debug_info"].items():
            prompt_parts.append(f"- {key}: {value}")
        prompt_parts.append("\n")

    # Add AI memory if available
    if context.get("ai_memory"):
        prompt_parts.append("## AI Memory\n")

        memory_context = context["ai_memory"]

        # Add recent memory
        if memory_context.get("recent_memory"):
            prompt_parts.append("### Recent Memory\n")
            prompt_parts.append(memory_context["recent_memory"]["summary"])
            prompt_parts.append("\n")

        # Add similar memories
        if memory_context.get("similar_memories"):
            prompt_parts.append("### Relevant Past Interactions\n")
            for memory in memory_context["similar_memories"]:
                prompt_parts.append(f"- {memory['summary']}")
            prompt_parts.append("\n")

    # Add memory insights if available
    if context.get("memory_insights"):
        prompt_parts.append("## Key User Insights\n")
        for insight in context["memory_insights"]:
            timestamp = insight.get("timestamp", "")
            content = insight.get("content", "")
            if timestamp and content:
                prompt_parts.append(f"- [{timestamp}] {content}")
            elif content:
                prompt_parts.append(f"- {content}")
        prompt_parts.append("\n")

    # Add health metrics
    if context.get("health_metrics"):
        prompt_parts.append("## Relevant Health Data\n")

        for metric_type, metrics in context["health_metrics"].items():
            if metrics:
                prompt_parts.append(f"### {metric_type.title()} Data\n")

                for metric in metrics:
                    prompt_parts.append(f"- Date: {metric.date}")
                    prompt_parts.append(f"  Source: {metric.source}")

                    # Add similarity score if available
                    if hasattr(metric, "similarity"):
                        prompt_parts.append(f"  Relevance: {metric.similarity:.2f}")

                    # Format the metric value
                    for key, value in metric.value.items():
                        prompt_parts.append(f"  {key}: {value}")

                prompt_parts.append("\n")
    else:
        prompt_parts.append("## Health Data\n")
        prompt_parts.append("No relevant health data found for this query.\n\n")

    return "\n".join(prompt_parts)


def combine_rag_results(
    health_metrics_results: Dict[str, List[HealthMetric]], memory_results: Dict[str, Any], max_items_per_source: int = 5
) -> Dict[str, Any]:
    """
    Combine results from different RAG sources into a unified context.

    Args:
        health_metrics_results: Results from health metrics search
        memory_results: Results from memory search
        max_items_per_source: Maximum number of items to include from each source

    Returns:
        Combined context dictionary
    """
    combined_context = {"health_metrics": {}, "ai_memory": None, "memory_insights": []}

    # Process health metrics
    for metric_type, metrics in health_metrics_results.items():
        # Sort by similarity if available
        sorted_metrics = sorted(metrics, key=lambda x: getattr(x, "similarity", 0), reverse=True)[:max_items_per_source]

        combined_context["health_metrics"][metric_type] = sorted_metrics

    # Process memory results
    if memory_results and memory_results.get("has_memory"):
        combined_context["ai_memory"] = memory_results

        # Extract insights if available
        if "insights" in memory_results:
            combined_context["memory_insights"] = memory_results["insights"][:max_items_per_source]

    return combined_context

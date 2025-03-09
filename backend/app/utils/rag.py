import os
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.models.ai_memory import AIMemory
from app.models.health_metric import HealthMetric
from app.services.ai_memory import get_ai_memory
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
    context = {"query": query, "health_metrics": {}, "ai_memory": None}

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
            context["health_metrics"][metric_type] = similar_metrics
    else:
        # If no specific metric types are requested, retrieve all types
        similar_metrics = find_similar_health_metrics(
            db=db,
            user_id=user_id,
            query_embedding=query_embedding,
            limit=max_metrics_per_type * 3,  # Retrieve more metrics when not filtering by type
            min_similarity=min_similarity,
        )

        # Group by metric type
        grouped_metrics = {}
        for metric in similar_metrics:
            if metric.metric_type not in grouped_metrics:
                grouped_metrics[metric.metric_type] = []

            if len(grouped_metrics[metric.metric_type]) < max_metrics_per_type:
                grouped_metrics[metric.metric_type].append(metric)

        context["health_metrics"] = grouped_metrics

    # Retrieve AI memory
    ai_memory = get_ai_memory(db, user_id)
    if ai_memory:
        context["ai_memory"] = ai_memory

    return context


def format_context_for_prompt(context: Dict[str, Any]) -> str:
    """
    Format the retrieved context into a string that can be used in an AI prompt.
    """
    prompt_parts = ["# User Context\n"]

    # Add AI memory if available
    if context.get("ai_memory"):
        prompt_parts.append("## AI Memory\n")
        prompt_parts.append(context["ai_memory"].summary)
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

                    # Format the metric value
                    for key, value in metric.value.items():
                        prompt_parts.append(f"  {key}: {value}")

                    prompt_parts.append("")

    return "\n".join(prompt_parts)

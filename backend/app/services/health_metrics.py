from datetime import date
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.models.health_metric import HealthMetric
from app.schemas.health_metric import HealthMetricCreate, HealthMetricUpdate
from app.utils.embeddings import generate_health_metric_embedding
from pgvector.sqlalchemy import Vector
from sqlalchemy import func, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Session


def create_health_metric(db: Session, obj_in: HealthMetricCreate) -> HealthMetric:
    """Create a new health metric with embedding."""
    # Generate embedding for the health metric
    embedding = generate_health_metric_embedding(metric_type=obj_in.metric_type, value=obj_in.value, source=obj_in.source)

    # Create DB object
    db_obj = HealthMetric(
        user_id=obj_in.user_id,
        date=obj_in.date,
        metric_type=obj_in.metric_type,
        value=obj_in.value,
        source=obj_in.source,
        embedding=embedding,
    )

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_health_metric(db: Session, id: UUID) -> Optional[HealthMetric]:
    """Get a health metric by ID."""
    return db.query(HealthMetric).filter(HealthMetric.id == id).first()


def get_health_metrics_by_user(
    db: Session,
    user_id: UUID,
    skip: int = 0,
    limit: int = 100,
    metric_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[HealthMetric]:
    """Get health metrics for a user with optional filtering."""
    query = db.query(HealthMetric).filter(HealthMetric.user_id == user_id)

    if metric_type:
        query = query.filter(HealthMetric.metric_type == metric_type)

    if start_date:
        query = query.filter(HealthMetric.date >= start_date)

    if end_date:
        query = query.filter(HealthMetric.date <= end_date)

    return query.order_by(HealthMetric.date.desc()).offset(skip).limit(limit).all()


def update_health_metric(db: Session, db_obj: HealthMetric, obj_in: HealthMetricUpdate) -> HealthMetric:
    """Update a health metric."""
    update_data = obj_in.model_dump(exclude_unset=True)

    # If any of the embedding-related fields are updated, regenerate the embedding
    if any(field in update_data for field in ["metric_type", "value", "source"]):
        # Get current values for fields not being updated
        metric_type = update_data.get("metric_type", db_obj.metric_type)
        value = update_data.get("value", db_obj.value)
        source = update_data.get("source", db_obj.source)

        # Generate new embedding
        embedding = generate_health_metric_embedding(metric_type=metric_type, value=value, source=source)
        update_data["embedding"] = embedding

    # Update the object
    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_health_metric(db: Session, id: UUID) -> None:
    """Delete a health metric."""
    db_obj = db.query(HealthMetric).get(id)
    if db_obj:
        db.delete(db_obj)
        db.commit()


def find_similar_health_metrics(
    db: Session,
    user_id: UUID,
    query_embedding: List[float],
    metric_type: Optional[str] = None,
    limit: int = 10,
    min_similarity: float = 0.7,
) -> List[HealthMetric]:
    """Find health metrics similar to the query embedding using vector similarity."""
    # Base query
    query = db.query(HealthMetric).filter(HealthMetric.user_id == user_id)

    # Add metric type filter if provided
    if metric_type:
        query = query.filter(HealthMetric.metric_type == metric_type)

    # Add similarity calculation and filter
    # Note: This uses the PostgreSQL pgvector extension's cosine similarity operator
    # For cosine similarity, we need to convert the threshold to a distance
    # cosine_distance = 1 - cosine_similarity
    max_distance = 1.0 - min_similarity

    query = (
        query.filter(HealthMetric.embedding.cosine_distance(query_embedding) <= max_distance)
        .order_by(HealthMetric.embedding.cosine_distance(query_embedding))
        .limit(limit)
    )

    return query.all()

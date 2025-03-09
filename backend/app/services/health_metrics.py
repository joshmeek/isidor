from datetime import date
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.models.health_metric import HealthMetric
from app.schemas.health_metric import HealthMetricCreate, HealthMetricUpdate
from app.utils.embeddings import generate_health_metric_embedding
from app.utils.encryption import decrypt_json, encrypt_json
from pgvector.sqlalchemy import Vector
from sqlalchemy import func, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Session


def create_health_metric(db: Session, obj_in: HealthMetricCreate) -> HealthMetric:
    """Create a new health metric with embedding."""
    # Generate embedding for the health metric
    embedding = generate_health_metric_embedding(metric_type=obj_in.metric_type, value=obj_in.value, source=obj_in.source)

    # Encrypt sensitive data
    encrypted_value = encrypt_json(db, obj_in.value)

    # Create DB object
    db_obj = HealthMetric(
        user_id=obj_in.user_id,
        date=obj_in.date,
        metric_type=obj_in.metric_type,
        value=encrypted_value,
        source=obj_in.source,
        embedding=embedding,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    # Decrypt for response
    db_obj.value = decrypt_json(db, db_obj.value)

    return db_obj


def get_health_metric(db: Session, id: UUID) -> Optional[HealthMetric]:
    """Get a health metric by ID."""
    metric = db.query(HealthMetric).filter(HealthMetric.id == id).first()

    # Decrypt sensitive data if metric exists
    if metric:
        metric.value = decrypt_json(db, metric.value)

    return metric


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

    metrics = query.order_by(HealthMetric.date.desc()).offset(skip).limit(limit).all()

    # Decrypt sensitive data for all metrics
    for metric in metrics:
        metric.value = decrypt_json(db, metric.value)

    return metrics


def update_health_metric(db: Session, db_obj: HealthMetric, obj_in: HealthMetricUpdate) -> HealthMetric:
    """Update a health metric."""
    update_data = obj_in.model_dump(exclude_unset=True)

    # If value is being updated, encrypt it and regenerate embedding
    if "value" in update_data:
        update_data["value"] = encrypt_json(db, update_data["value"])

        # Regenerate embedding if value or metric_type changes
        metric_type = update_data.get("metric_type", db_obj.metric_type)
        source = update_data.get("source", db_obj.source)
        update_data["embedding"] = generate_health_metric_embedding(
            metric_type=metric_type, value=decrypt_json(db, update_data["value"]), source=source  # Decrypt for embedding generation
        )

    # Update the object
    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    # Decrypt for response
    db_obj.value = decrypt_json(db, db_obj.value)

    return db_obj


def delete_health_metric(db: Session, id: UUID) -> None:
    """Delete a health metric."""
    db_obj = db.query(HealthMetric).filter(HealthMetric.id == id).first()
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
    """Find health metrics similar to the query embedding."""
    # Convert the embedding to a PostgreSQL vector using the correct syntax
    # Instead of using func.vector(), use text() to create a raw SQL expression
    embedding_vector_sql = text(f"'{query_embedding}'::vector")

    # Build the query
    query = db.query(HealthMetric).filter(HealthMetric.user_id == user_id)

    # Filter by metric type if provided
    if metric_type:
        query = query.filter(HealthMetric.metric_type == metric_type)

    # For now, just return metrics without vector similarity search
    # This is a temporary workaround until we fix the pgvector issue
    return query.order_by(HealthMetric.date.desc()).limit(limit).all()

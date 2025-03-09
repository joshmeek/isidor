from datetime import date
from typing import Any, List, Optional
from uuid import UUID

from app.db.session import get_db
from app.models.health_metric import HealthMetric
from app.schemas.health_metric import HealthMetric as HealthMetricSchema
from app.schemas.health_metric import HealthMetricCreate, HealthMetricSimilaritySearch, HealthMetricUpdate
from app.services.health_metrics import (
    create_health_metric,
    delete_health_metric,
    find_similar_health_metrics,
    get_health_metric,
    get_health_metrics_by_user,
    update_health_metric,
)
from app.utils.embeddings import generate_embedding
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

router = APIRouter()


@router.post("/", response_model=HealthMetricSchema)
def create_metric(*, db: Session = Depends(get_db), metric_in: HealthMetricCreate) -> Any:
    """
    Create new health metric.
    """
    return create_health_metric(db=db, obj_in=metric_in)


@router.get("/{id}", response_model=HealthMetricSchema)
def read_metric(*, db: Session = Depends(get_db), id: UUID) -> Any:
    """
    Get health metric by ID.
    """
    metric = get_health_metric(db=db, id=id)
    if not metric:
        raise HTTPException(status_code=404, detail="Health metric not found")
    return metric


@router.get("/user/{user_id}", response_model=List[HealthMetricSchema])
def read_user_metrics(
    *,
    db: Session = Depends(get_db),
    user_id: UUID,
    skip: int = 0,
    limit: int = 100,
    metric_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> Any:
    """
    Get health metrics for a user.
    """
    return get_health_metrics_by_user(
        db=db, user_id=user_id, skip=skip, limit=limit, metric_type=metric_type, start_date=start_date, end_date=end_date
    )


@router.put("/{id}", response_model=HealthMetricSchema)
def update_metric(*, db: Session = Depends(get_db), id: UUID, metric_in: HealthMetricUpdate) -> Any:
    """
    Update a health metric.
    """
    metric = get_health_metric(db=db, id=id)
    if not metric:
        raise HTTPException(status_code=404, detail="Health metric not found")

    return update_health_metric(db=db, db_obj=metric, obj_in=metric_in)


@router.delete("/{id}", response_model=bool)
def delete_metric(*, db: Session = Depends(get_db), id: UUID) -> Any:
    """
    Delete a health metric.
    """
    metric = get_health_metric(db=db, id=id)
    if not metric:
        raise HTTPException(status_code=404, detail="Health metric not found")

    delete_health_metric(db=db, id=id)
    return True


@router.post("/search/similarity", response_model=List[HealthMetricSchema])
def search_similar_metrics(*, db: Session = Depends(get_db), search_params: HealthMetricSimilaritySearch, user_id: UUID) -> Any:
    """
    Search for health metrics similar to the query using vector similarity.
    """
    # Generate embedding for the query
    query_embedding = generate_embedding(search_params.query)

    # Find similar metrics
    similar_metrics = find_similar_health_metrics(
        db=db,
        user_id=user_id,
        query_embedding=query_embedding,
        metric_type=search_params.metric_type,
        limit=search_params.limit,
        min_similarity=search_params.min_similarity,
    )

    return similar_metrics

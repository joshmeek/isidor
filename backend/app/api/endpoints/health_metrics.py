from datetime import date
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.api.endpoints.auth import get_current_active_user
from app.db.session import get_db
from app.models.health_metric import HealthMetric
from app.schemas.health_metric import HealthMetric as HealthMetricSchema
from app.schemas.health_metric import HealthMetricCreate, HealthMetricSimilaritySearch, HealthMetricUpdate, MetricType
from app.schemas.user import User as UserSchema
from app.services.health_metrics import (
    create_health_metric,
    delete_health_metric,
    find_similar_health_metrics,
    get_health_metric,
    get_health_metrics_by_user,
    get_health_metrics_stats,
    update_health_metric,
)
from app.utils.embeddings import generate_embedding
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

router = APIRouter()


@router.post(
    "/",
    response_model=HealthMetricSchema,
    status_code=201,
    responses={
        201: {
            "description": "Health metric created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                        "user_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                        "date": "2025-03-10",
                        "metric_type": "sleep",
                        "value": {"duration_hours": 7.5, "deep_sleep_hours": 1.2, "rem_sleep_hours": 1.8, "sleep_score": 85},
                        "source": "oura",
                    }
                }
            },
        },
        422: {
            "description": "Validation error",
            "content": {
                "application/json": {
                    "example": {
                        "detail": {
                            "errors": [
                                "Invalid metric type. Valid types are: sleep, activity, heart_rate, blood_pressure, weight, mood, calories, event"
                            ]
                        }
                    }
                }
            },
        },
    },
)
def create_metric(
    *, db: Session = Depends(get_db), metric_in: HealthMetricCreate, current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Create a new health metric.

    This endpoint allows users to create a new health metric with validation and data transformation.
    The metric will be validated against the schema for the specified metric type, and if it's from
    a known source (e.g., Oura, Fitbit), the data will be transformed into a standardized format.

    The endpoint also generates a vector embedding for the health metric, enabling semantic search
    capabilities.

    - **metric_type**: Type of health metric (sleep, activity, heart_rate, etc.)
    - **value**: JSON object containing the metric data (structure depends on metric_type)
    - **source**: Source of the data (manual, oura, fitbit, etc.)
    - **date**: Date of the health metric (defaults to today if not provided)

    Only authenticated users can create health metrics, and they can only create metrics for themselves.
    """
    # Ensure the user can only create metrics for themselves
    if metric_in.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to create metrics for other users")

    return create_health_metric(db=db, obj_in=metric_in)


@router.get(
    "/{id}",
    response_model=HealthMetricSchema,
    responses={
        200: {
            "description": "Health metric retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                        "user_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                        "date": "2025-03-10",
                        "metric_type": "sleep",
                        "value": {"duration_hours": 7.5, "deep_sleep_hours": 1.2, "rem_sleep_hours": 1.8, "sleep_score": 85},
                        "source": "oura",
                    }
                }
            },
        },
        404: {"description": "Health metric not found"},
    },
)
def read_metric(*, db: Session = Depends(get_db), id: UUID, current_user: UserSchema = Depends(get_current_active_user)) -> Any:
    """
    Get a health metric by ID.

    Retrieves a specific health metric by its unique identifier. The metric's value is automatically
    decrypted before being returned to the client.

    Only authenticated users can access health metrics, and they can only access their own metrics.
    """
    metric = get_health_metric(db=db, id=id)
    if not metric:
        raise HTTPException(status_code=404, detail="Health metric not found")

    # Ensure the user can only access their own metrics
    if metric.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this metric")

    return metric


@router.get(
    "/user/{user_id}",
    response_model=List[HealthMetricSchema],
    responses={
        200: {
            "description": "Health metrics retrieved successfully",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                            "user_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                            "date": "2025-03-10",
                            "metric_type": "sleep",
                            "value": {"duration_hours": 7.5, "deep_sleep_hours": 1.2, "rem_sleep_hours": 1.8, "sleep_score": 85},
                            "source": "oura",
                        }
                    ]
                }
            },
        }
    },
)
def read_user_metrics(
    *,
    db: Session = Depends(get_db),
    user_id: UUID,
    skip: int = Query(0, description="Number of records to skip for pagination"),
    limit: int = Query(100, description="Maximum number of records to return"),
    metric_type: Optional[MetricType] = Query(None, description="Filter by metric type (e.g., sleep, activity)"),
    start_date: Optional[date] = Query(None, description="Filter by start date (inclusive)"),
    end_date: Optional[date] = Query(None, description="Filter by end date (inclusive)"),
    current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Get health metrics for a user.

    Retrieves a list of health metrics for a specific user, with optional filtering by metric type
    and date range. The results can be paginated using the skip and limit parameters.

    All metric values are automatically decrypted before being returned to the client.

    Only authenticated users can access health metrics, and they can only access their own metrics.
    """
    # Ensure the user can only access their own metrics
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access metrics for other users")

    return get_health_metrics_by_user(
        db=db, user_id=user_id, skip=skip, limit=limit, metric_type=metric_type, start_date=start_date, end_date=end_date
    )


@router.put(
    "/{id}",
    response_model=HealthMetricSchema,
    responses={
        200: {"description": "Health metric updated successfully"},
        404: {"description": "Health metric not found"},
        422: {"description": "Validation error"},
    },
)
def update_metric(
    *, db: Session = Depends(get_db), id: UUID, metric_in: HealthMetricUpdate, current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Update a health metric.

    Updates an existing health metric with new values. The updated metric will be validated against
    the schema for the specified metric type, and if it's from a known source, the data will be
    transformed into a standardized format.

    If the value is updated, a new vector embedding will be generated for the health metric.

    Only authenticated users can update health metrics, and they can only update their own metrics.
    """
    metric = get_health_metric(db=db, id=id)
    if not metric:
        raise HTTPException(status_code=404, detail="Health metric not found")

    # Ensure the user can only update their own metrics
    if metric.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this metric")

    return update_health_metric(db=db, db_obj=metric, obj_in=metric_in)


@router.delete(
    "/{id}",
    response_model=bool,
    responses={200: {"description": "Health metric deleted successfully"}, 404: {"description": "Health metric not found"}},
)
def delete_metric(*, db: Session = Depends(get_db), id: UUID, current_user: UserSchema = Depends(get_current_active_user)) -> Any:
    """
    Delete a health metric.

    Permanently removes a health metric from the database.

    Only authenticated users can delete health metrics, and they can only delete their own metrics.
    """
    metric = get_health_metric(db=db, id=id)
    if not metric:
        raise HTTPException(status_code=404, detail="Health metric not found")

    # Ensure the user can only delete their own metrics
    if metric.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this metric")

    delete_health_metric(db=db, id=id)
    return True


@router.post(
    "/search/similarity",
    response_model=List[HealthMetricSchema],
    responses={200: {"description": "Similar health metrics found"}, 422: {"description": "Validation error"}},
)
def search_similar_metrics(
    *,
    db: Session = Depends(get_db),
    search_params: HealthMetricSimilaritySearch,
    user_id: UUID,
    current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Search for health metrics similar to a query.

    This endpoint uses vector similarity search to find health metrics that are semantically similar
    to the provided query. The search can be filtered by metric type and similarity threshold.

    Only authenticated users can search for health metrics, and they can only search their own metrics.
    """
    # Ensure the user can only search their own metrics
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to search metrics for other users")

    # Generate embedding for the query
    query_embedding = generate_embedding(search_params.query)

    # Find similar health metrics
    similar_metrics = find_similar_health_metrics(
        db=db,
        user_id=user_id,
        query_embedding=query_embedding,
        metric_type=search_params.metric_type,
        limit=search_params.limit,
        min_similarity=search_params.min_similarity,
    )

    # Decrypt sensitive data for all metrics
    for metric in similar_metrics:
        metric.value = decrypt_json(db, metric.value)

    return similar_metrics


@router.get(
    "/stats/{user_id}/{metric_type}",
    response_model=Dict[str, Any],
    responses={
        200: {
            "description": "Health metrics statistics retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "count": 30,
                        "date_range": {"start": "2025-02-10", "end": "2025-03-10"},
                        "metric_type": "sleep",
                        "sleep_duration": {"average": 7.2, "min": 6.0, "max": 8.5},
                        "sleep_score": {"average": 82, "min": 65, "max": 95},
                    }
                }
            },
        },
        422: {"description": "Validation error"},
    },
)
def get_metrics_stats(
    *,
    db: Session = Depends(get_db),
    user_id: UUID,
    metric_type: MetricType,
    start_date: Optional[date] = Query(None, description="Filter by start date (inclusive)"),
    end_date: Optional[date] = Query(None, description="Filter by end date (inclusive)"),
    current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Get statistics for a specific health metric type.

    Calculates statistics for a specific health metric type, such as average, min, and max values
    for each field. The statistics can be filtered by date range.

    Only authenticated users can access health metrics statistics, and they can only access their own metrics.
    """
    # Ensure the user can only access their own metrics
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access metrics for other users")

    return get_health_metrics_stats(db=db, user_id=user_id, metric_type=metric_type, start_date=start_date, end_date=end_date)

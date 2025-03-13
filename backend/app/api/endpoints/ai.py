from typing import Any, Dict, List, Optional
from uuid import UUID

from app.api.endpoints.auth import get_current_active_user
from app.db.session import get_db
from app.schemas.user import User as UserSchema
from app.services.ai import TimeFrame, analyze_health_trends, generate_health_insight, generate_protocol_recommendation
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

router = APIRouter()


class HealthInsightRequest(BaseModel):
    query: str
    metric_types: Optional[List[str]] = None
    update_memory: bool = True
    time_frame: TimeFrame = TimeFrame.LAST_DAY


class ProtocolRecommendationRequest(BaseModel):
    health_goal: str
    current_metrics: Optional[List[str]] = None
    time_frame: Optional[TimeFrame] = None


class TrendAnalysisRequest(BaseModel):
    metric_type: str
    time_period: TimeFrame = TimeFrame.LAST_WEEK
    use_cache: bool = False


@router.post("/insights/{user_id}", response_model=Dict[str, Any])
async def get_health_insight(
    *,
    db: Session = Depends(get_db),
    user_id: UUID,
    request: HealthInsightRequest,
    current_user: UserSchema = Depends(get_current_active_user),
) -> Any:
    """
    Generate a health insight using Gemini AI with RAG.

    Returns a response with:
    - response: The AI-generated insight
    - has_data: Boolean indicating if relevant health data was found
    - metadata: Additional information about the request and response
    """
    # Ensure the user can only access their own insights
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access insights for other users")

    try:
        result = await generate_health_insight(
            db=db,
            user_id=user_id,
            query=request.query,
            metric_types=request.metric_types,
            update_memory=request.update_memory,
            time_frame=request.time_frame,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate health insight: {str(e)}")


@router.post("/protocols/{user_id}", response_model=Dict[str, Any])
async def get_protocol_recommendation(
    *,
    db: Session = Depends(get_db),
    user_id: UUID,
    request: ProtocolRecommendationRequest,
    current_user: UserSchema = Depends(get_current_active_user),
) -> Any:
    """
    Generate a protocol recommendation using Gemini AI.

    Returns a response with:
    - protocol_recommendation: The AI-generated protocol recommendation
    - has_data: Boolean indicating if relevant health data was found
    - has_active_protocols: Boolean indicating if the user has active protocols
    - metadata: Additional information about the request and response
    """
    # Ensure the user can only access their own protocol recommendations
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access protocol recommendations for other users")

    try:
        # If current_metrics is not provided, fetch all available metric types for the user
        current_metrics = request.current_metrics
        if current_metrics is None:
            # You might need to implement a function to get all available metric types for a user
            # For now, we'll use an empty list which will make the AI service consider all metrics
            current_metrics = []
        
        # Use the provided time_frame or let the service use its default
        time_frame_param = {}
        if request.time_frame is not None:
            time_frame_param["time_frame"] = request.time_frame
        
        result = await generate_protocol_recommendation(
            db=db, 
            user_id=user_id, 
            health_goal=request.health_goal, 
            current_metrics=current_metrics,
            **time_frame_param
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate protocol recommendation: {str(e)}")


@router.post("/trends/{user_id}", response_model=Dict[str, Any])
async def get_trend_analysis(
    *,
    db: Session = Depends(get_db),
    user_id: UUID,
    request: TrendAnalysisRequest,
    current_user: UserSchema = Depends(get_current_active_user),
) -> Any:
    """
    Analyze health trends for a specific metric using Gemini AI.

    Returns a response with:
    - trend_analysis: The AI-generated trend analysis
    - has_data: Boolean indicating if relevant health data was found
    - metadata: Additional information about the request and response
    """
    # Ensure the user can only access their own trend analysis
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access trend analysis for other users")

    try:
        result = await analyze_health_trends(
            db=db, user_id=user_id, metric_type=request.metric_type, time_period=request.time_period, use_cache=request.use_cache
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze health trends: {str(e)}")

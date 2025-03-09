from typing import Any, Dict, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.services.ai import (
    generate_health_insight,
    generate_protocol_recommendation,
    analyze_health_trends
)

router = APIRouter()


class HealthInsightRequest(BaseModel):
    query: str
    metric_types: Optional[List[str]] = None
    update_memory: bool = True


class ProtocolRecommendationRequest(BaseModel):
    health_goal: str
    current_metrics: List[str]


class TrendAnalysisRequest(BaseModel):
    metric_type: str
    time_period: str = "last_month"


@router.post("/insights/{user_id}", response_model=Dict[str, Any])
async def get_health_insight(
    *,
    db: Session = Depends(get_db),
    user_id: UUID,
    request: HealthInsightRequest
) -> Any:
    """
    Generate a health insight using Gemini AI with RAG.
    """
    try:
        result = await generate_health_insight(
            db=db,
            user_id=user_id,
            query=request.query,
            metric_types=request.metric_types,
            update_memory=request.update_memory
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate health insight: {str(e)}"
        )


@router.post("/protocols/{user_id}", response_model=Dict[str, Any])
async def get_protocol_recommendation(
    *,
    db: Session = Depends(get_db),
    user_id: UUID,
    request: ProtocolRecommendationRequest
) -> Any:
    """
    Generate a protocol recommendation using Gemini AI.
    """
    try:
        result = await generate_protocol_recommendation(
            db=db,
            user_id=user_id,
            health_goal=request.health_goal,
            current_metrics=request.current_metrics
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate protocol recommendation: {str(e)}"
        )


@router.post("/trends/{user_id}", response_model=Dict[str, Any])
async def get_trend_analysis(
    *,
    db: Session = Depends(get_db),
    user_id: UUID,
    request: TrendAnalysisRequest
) -> Any:
    """
    Analyze health trends for a specific metric using Gemini AI.
    """
    try:
        result = await analyze_health_trends(
            db=db,
            user_id=user_id,
            metric_type=request.metric_type,
            time_period=request.time_period
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze health trends: {str(e)}"
        ) 
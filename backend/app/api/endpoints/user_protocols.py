from typing import Any, Dict, List, Optional
from uuid import UUID

from app.api.endpoints.auth import get_current_active_user
from app.db.session import get_db
from app.schemas.user import User as UserSchema
from app.schemas.user_protocol import UserProtocol
from app.schemas.user_protocol import UserProtocol as UserProtocolSchema
from app.schemas.user_protocol import (
    UserProtocolCreate,
    UserProtocolCreateAndEnroll,
    UserProtocolProgress,
    UserProtocolStatusUpdate,
    UserProtocolUpdate,
)
from app.services.user_protocol import (
    create_user_protocol,
    delete_user_protocol,
    enroll_user_in_protocol,
    get_active_user_protocols,
    get_user_protocol,
    get_user_protocol_ai_adjustments,
    get_user_protocol_ai_analysis,
    get_user_protocol_effectiveness,
    get_user_protocol_progress,
    get_user_protocol_recommendations,
    get_user_protocols,
    update_user_protocol,
    update_user_protocol_status,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/", response_model=List[UserProtocol])
def read_user_protocols(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Retrieve user protocols.
    """
    user_protocols = get_user_protocols(db=db, user_id=current_user.id, skip=skip, limit=limit, status=status)
    return user_protocols


@router.get("/active", response_model=List[UserProtocol])
def read_active_user_protocols(*, db: Session = Depends(get_db), current_user: UserSchema = Depends(get_current_active_user)) -> Any:
    """
    Retrieve active user protocols.
    """
    user_protocols = get_active_user_protocols(db=db, user_id=current_user.id)
    return user_protocols


@router.post("/enroll", response_model=UserProtocolSchema)
def enroll_in_protocol(
    *, db: Session = Depends(get_db), protocol_in: UserProtocolCreate, current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Enroll user in a protocol.
    """
    user_protocol = enroll_user_in_protocol(db=db, user_id=current_user.id, protocol_create=protocol_in, start_date=protocol_in.start_date)

    if not user_protocol:
        raise HTTPException(status_code=404, detail="Failed to create user protocol")

    return user_protocol


@router.get("/{user_protocol_id}", response_model=UserProtocol)
def read_user_protocol(
    *, db: Session = Depends(get_db), user_protocol_id: UUID, current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Get user protocol by ID.
    """
    user_protocol = get_user_protocol(db=db, user_protocol_id=user_protocol_id)
    if not user_protocol:
        raise HTTPException(status_code=404, detail="User protocol not found")

    # Check if the protocol belongs to the current user
    if user_protocol.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this protocol")

    return user_protocol


@router.put("/{user_protocol_id}", response_model=UserProtocolSchema)
def update_user_protocol_endpoint(
    *,
    db: Session = Depends(get_db),
    user_protocol_id: UUID,
    protocol_in: UserProtocolUpdate,
    current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Update a user protocol.
    """
    user_protocol = get_user_protocol(db=db, user_protocol_id=user_protocol_id)
    if not user_protocol:
        raise HTTPException(status_code=404, detail="User protocol not found")

    # Check if the protocol belongs to the current user
    if user_protocol.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this protocol")

    user_protocol = update_user_protocol(db=db, user_protocol_id=str(user_protocol_id), protocol_update=protocol_in)
    return user_protocol


@router.put("/{user_protocol_id}/status", response_model=UserProtocolSchema)
def update_status(
    *,
    db: Session = Depends(get_db),
    user_protocol_id: UUID,
    status_update: UserProtocolStatusUpdate,
    current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Update the status of a user protocol.
    """
    user_protocol = get_user_protocol(db=db, user_protocol_id=user_protocol_id)
    if not user_protocol:
        raise HTTPException(status_code=404, detail="User protocol not found")

    # Check if the protocol belongs to the current user
    if user_protocol.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this protocol")

    updated_protocol = update_user_protocol_status(db=db, user_protocol_id=user_protocol_id, status=status_update.status)

    if not updated_protocol:
        raise HTTPException(status_code=400, detail="Invalid status")

    return updated_protocol


@router.delete("/{user_protocol_id}", response_model=dict)
def delete_user_protocol_endpoint(
    *, db: Session = Depends(get_db), user_protocol_id: UUID, current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Delete a user protocol.
    """
    user_protocol = get_user_protocol(db=db, user_protocol_id=user_protocol_id)
    if not user_protocol:
        raise HTTPException(status_code=404, detail="User protocol not found")

    # Check if the protocol belongs to the current user
    if user_protocol.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this protocol")

    delete_user_protocol(db=db, user_protocol_id=user_protocol_id)
    return {"message": "User protocol deleted successfully"}


@router.get("/{user_protocol_id}/progress", response_model=UserProtocolProgress)
def get_progress(
    *, db: Session = Depends(get_db), user_protocol_id: UUID, current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Get progress information for a user protocol.
    """
    user_protocol = get_user_protocol(db=db, user_protocol_id=user_protocol_id)
    if not user_protocol:
        raise HTTPException(status_code=404, detail="User protocol not found")

    # Check if the protocol belongs to the current user
    if user_protocol.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this protocol")

    progress = get_user_protocol_progress(db=db, user_protocol_id=user_protocol_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Failed to get protocol progress")

    return progress


@router.get("/{user_protocol_id}/effectiveness", response_model=Dict[str, Any])
def get_effectiveness(
    *,
    db: Session = Depends(get_db),
    user_protocol_id: UUID,
    evaluation_period_days: int = Query(7, ge=1, le=90),
    current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Get effectiveness metrics for a user protocol.

    This endpoint provides rule-based effectiveness metrics for the protocol,
    comparing baseline metrics before the protocol started with recent metrics.
    """
    user_protocol = get_user_protocol(db=db, user_protocol_id=user_protocol_id)
    if not user_protocol:
        raise HTTPException(status_code=404, detail="User protocol not found")

    # Check if the protocol belongs to the current user
    if user_protocol.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this protocol")

    effectiveness = get_user_protocol_effectiveness(db=db, user_protocol_id=user_protocol_id, evaluation_period_days=evaluation_period_days)

    return effectiveness


@router.get("/{user_protocol_id}/recommendations", response_model=Dict[str, Any])
def get_recommendations(
    *, db: Session = Depends(get_db), user_protocol_id: UUID, current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Get rule-based recommendations for protocol adjustments.

    This endpoint provides recommendations for adjusting the protocol based on
    effectiveness metrics, using a rule-based approach.
    """
    user_protocol = get_user_protocol(db=db, user_protocol_id=user_protocol_id)
    if not user_protocol:
        raise HTTPException(status_code=404, detail="User protocol not found")

    # Check if the protocol belongs to the current user
    if user_protocol.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this protocol")

    recommendations = get_user_protocol_recommendations(db=db, user_protocol_id=user_protocol_id)

    return recommendations


@router.get("/{user_protocol_id}/ai-analysis", response_model=Dict[str, Any])
async def get_ai_analysis(
    *, db: Session = Depends(get_db), user_protocol_id: UUID, current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Get AI-powered analysis of protocol effectiveness.

    This endpoint provides an in-depth analysis of protocol effectiveness using
    Gemini AI, offering research-backed insights and pattern recognition.
    """
    user_protocol = get_user_protocol(db=db, user_protocol_id=user_protocol_id)
    if not user_protocol:
        raise HTTPException(status_code=404, detail="User protocol not found")

    # Check if the protocol belongs to the current user
    if user_protocol.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this protocol")

    analysis = await get_user_protocol_ai_analysis(db=db, user_protocol_id=user_protocol_id)

    if "error" in analysis:
        raise HTTPException(status_code=404, detail=analysis["error"])

    return analysis


@router.get("/{user_protocol_id}/ai-adjustments", response_model=Dict[str, Any])
async def get_ai_adjustments(
    *, db: Session = Depends(get_db), user_protocol_id: UUID, current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Get AI-powered protocol adjustment recommendations.

    This endpoint provides personalized, research-backed recommendations for
    adjusting the protocol using Gemini AI, offering more nuanced and
    context-aware suggestions than the rule-based approach.
    """
    user_protocol = get_user_protocol(db=db, user_protocol_id=user_protocol_id)
    if not user_protocol:
        raise HTTPException(status_code=404, detail="User protocol not found")

    # Check if the protocol belongs to the current user
    if user_protocol.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this protocol")

    adjustments = await get_user_protocol_ai_adjustments(db=db, user_protocol_id=user_protocol_id)

    if "error" in adjustments:
        raise HTTPException(status_code=404, detail=adjustments["error"])

    return adjustments


@router.post("/create-and-enroll", response_model=UserProtocol)
def create_and_enroll_protocol(
    *, db: Session = Depends(get_db), protocol_in: UserProtocolCreateAndEnroll, current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Create a new user protocol and automatically enroll the current user.
    """
    try:
        # Create the user protocol
        user_protocol = create_user_protocol(db=db, user_id=str(current_user.id), protocol=protocol_in)

        if not user_protocol:
            raise HTTPException(status_code=404, detail="Failed to create user protocol")

        return user_protocol
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

from typing import Any, List, Optional
from uuid import UUID

from app.api.endpoints.auth import get_current_active_user
from app.db.session import get_db
from app.schemas.user import User as UserSchema
from app.schemas.user_protocol import UserProtocol as UserProtocolSchema
from app.schemas.user_protocol import (
    UserProtocolCreate,
    UserProtocolProgress,
    UserProtocolStatusUpdate,
    UserProtocolUpdate,
    UserProtocolWithProtocol,
)
from app.services.user_protocol import (
    delete_user_protocol,
    enroll_user_in_protocol,
    get_active_user_protocols,
    get_user_protocol,
    get_user_protocol_progress,
    get_user_protocols,
    update_user_protocol,
    update_user_protocol_status,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/", response_model=List[UserProtocolWithProtocol])
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


@router.get("/active", response_model=List[UserProtocolWithProtocol])
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
    user_protocol = enroll_user_in_protocol(
        db=db, user_id=current_user.id, protocol_id=protocol_in.protocol_id, start_date=protocol_in.start_date
    )

    if not user_protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")

    return user_protocol


@router.get("/{user_protocol_id}", response_model=UserProtocolWithProtocol)
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

    user_protocol = update_user_protocol(db=db, db_obj=user_protocol, obj_in=protocol_in)
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

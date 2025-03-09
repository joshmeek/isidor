from datetime import date, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.models.protocol import Protocol
from app.models.user_protocol import UserProtocol
from app.schemas.user_protocol import UserProtocolCreate, UserProtocolUpdate
from app.services.protocol import get_protocol
from sqlalchemy import and_
from sqlalchemy.orm import Session


def get_user_protocol(db: Session, user_protocol_id: UUID) -> Optional[UserProtocol]:
    """Get a user protocol by ID."""
    return db.query(UserProtocol).filter(UserProtocol.id == user_protocol_id).first()


def get_user_protocols(db: Session, user_id: UUID, skip: int = 0, limit: int = 100, status: Optional[str] = None) -> List[UserProtocol]:
    """Get all protocols for a user with optional filtering by status."""
    query = db.query(UserProtocol).filter(UserProtocol.user_id == user_id)

    if status:
        query = query.filter(UserProtocol.status == status)

    return query.offset(skip).limit(limit).all()


def get_active_user_protocols(db: Session, user_id: UUID) -> List[UserProtocol]:
    """Get all active protocols for a user."""
    return db.query(UserProtocol).filter(and_(UserProtocol.user_id == user_id, UserProtocol.status == "active")).all()


def enroll_user_in_protocol(db: Session, user_id: UUID, protocol_id: UUID, start_date: Optional[date] = None) -> Optional[UserProtocol]:
    """Enroll a user in a protocol."""
    # Check if protocol exists
    protocol = get_protocol(db, protocol_id)
    if not protocol:
        return None

    # Use today's date if start_date is not provided
    if not start_date:
        start_date = date.today()

    # Calculate end date for fixed duration protocols
    end_date = None
    if protocol.duration_type == "fixed" and protocol.duration_days:
        end_date = start_date + timedelta(days=protocol.duration_days)

    # Create user protocol
    db_obj = UserProtocol(user_id=user_id, protocol_id=protocol_id, start_date=start_date, end_date=end_date, status="active")

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_user_protocol_status(db: Session, user_protocol_id: UUID, status: str) -> Optional[UserProtocol]:
    """Update the status of a user protocol."""
    db_obj = get_user_protocol(db, user_protocol_id)
    if not db_obj:
        return None

    # Validate status
    valid_statuses = ["active", "completed", "paused", "cancelled"]
    if status not in valid_statuses:
        return None

    # Update status
    db_obj.status = status

    # If completing the protocol, set end date to today if not already set
    if status == "completed" and not db_obj.end_date:
        db_obj.end_date = date.today()

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_user_protocol(db: Session, db_obj: UserProtocol, obj_in: UserProtocolUpdate) -> UserProtocol:
    """Update a user protocol."""
    update_data = obj_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_user_protocol(db: Session, user_protocol_id: UUID) -> None:
    """Delete a user protocol."""
    db_obj = db.query(UserProtocol).get(user_protocol_id)
    if db_obj:
        db.delete(db_obj)
        db.commit()


def get_user_protocol_progress(db: Session, user_protocol_id: UUID) -> Dict[str, Any]:
    """Get progress information for a user protocol."""
    db_obj = get_user_protocol(db, user_protocol_id)
    if not db_obj:
        return {}

    # Get protocol details
    protocol = db_obj.protocol

    # Calculate progress
    progress = {}

    # Calculate days elapsed
    start_date = db_obj.start_date
    today = date.today()
    days_elapsed = (today - start_date).days

    # Calculate completion percentage for fixed duration protocols
    completion_percentage = None
    if protocol.duration_type == "fixed" and protocol.duration_days:
        completion_percentage = min(100, int((days_elapsed / protocol.duration_days) * 100))

    # Calculate days remaining for fixed duration protocols
    days_remaining = None
    if protocol.duration_type == "fixed" and protocol.duration_days:
        days_remaining = max(0, protocol.duration_days - days_elapsed)

    # Compile progress information
    progress = {
        "user_protocol_id": db_obj.id,
        "protocol_id": protocol.id,
        "protocol_name": protocol.name,
        "status": db_obj.status,
        "start_date": start_date,
        "end_date": db_obj.end_date,
        "days_elapsed": days_elapsed,
        "days_remaining": days_remaining,
        "completion_percentage": completion_percentage,
        "duration_type": protocol.duration_type,
        "duration_days": protocol.duration_days,
        "target_metrics": protocol.target_metrics,
    }

    return progress

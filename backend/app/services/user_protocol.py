import uuid
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.models.protocol_check_in import ProtocolCheckIn
from app.models.user_protocol import UserProtocol
from app.schemas.protocol import CheckInCreate
from app.schemas.user_protocol import UserProtocolCreate, UserProtocolCreateAndEnroll, UserProtocolUpdate
from sqlalchemy import and_
from sqlalchemy.orm import Session, joinedload


def get_user_protocol(db: Session, user_protocol_id: UUID) -> Optional[UserProtocol]:
    """Get a user protocol by ID."""
    return db.query(UserProtocol).filter(UserProtocol.id == user_protocol_id).first()


def get_user_protocols(db: Session, user_id: UUID, skip: int = 0, limit: int = 100, status: Optional[str] = None) -> List[UserProtocol]:
    """
    Get all protocols for a user with pagination and filtering.

    Args:
        db: Database session
        user_id: ID of the user
        skip: Number of records to skip
        limit: Maximum number of records to return
        status: Filter by status (active, completed, paused, etc.)

    Returns:
        List of UserProtocol objects
    """
    # Convert string user_id to UUID if needed
    user_id_uuid = UUID(user_id) if isinstance(user_id, str) else user_id

    # Build the query
    query = db.query(UserProtocol).filter(UserProtocol.user_id == user_id_uuid)

    # Apply status filter if provided
    if status:
        query = query.filter(UserProtocol.status == status)

    # Apply pagination
    query = query.order_by(UserProtocol.created_at.desc())
    query = query.offset(skip).limit(limit)

    # Execute query
    user_protocols = query.all()

    # Process the results to fix validation issues
    for up in user_protocols:
        # Convert datetime to date for start_date and end_date
        if isinstance(up.start_date, datetime):
            up.start_date = up.start_date.date()
        if up.end_date and isinstance(up.end_date, datetime):
            up.end_date = up.end_date.date()

    return user_protocols


def get_active_user_protocols(db: Session, user_id: UUID) -> List[UserProtocol]:
    """Get all active protocols for a user."""
    return db.query(UserProtocol).filter(and_(UserProtocol.user_id == user_id, UserProtocol.status == "active")).all()


def enroll_user_in_protocol(
    db: Session, user_id: UUID, protocol_create: UserProtocolCreate, start_date: Optional[date] = None
) -> Optional[UserProtocol]:
    """Enroll a user in a protocol."""
    # Use today's date if start_date is not provided
    if not start_date:
        start_date = date.today()

    # Create user protocol
    db_obj = UserProtocol(
        user_id=user_id,
        name=protocol_create.name,
        description=protocol_create.description,
        start_date=start_date,
        end_date=None,
        status="active",
        target_metrics=protocol_create.target_metrics,
        steps=protocol_create.steps,
        recommendations=protocol_create.recommendations,
        expected_outcomes=protocol_create.expected_outcomes,
        category=protocol_create.category,
    )

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


def update_user_protocol(db: Session, user_protocol_id: str, protocol_update: UserProtocolUpdate) -> Optional[UserProtocol]:
    """
    Update a user protocol.

    Args:
        db: Database session
        user_protocol_id: ID of the user protocol to update
        protocol_update: Protocol update data

    Returns:
        Updated UserProtocol object if found, None otherwise
    """
    db_protocol = get_user_protocol(db, user_protocol_id)
    if not db_protocol:
        return None

    # Update protocol fields
    update_data = protocol_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_protocol, key, value)

    db.commit()
    db.refresh(db_protocol)

    return db_protocol


def delete_user_protocol(db: Session, user_protocol_id: str) -> bool:
    """
    Delete a user protocol.

    Args:
        db: Database session
        user_protocol_id: ID of the user protocol to delete

    Returns:
        True if deleted, False if not found
    """
    db_protocol = get_user_protocol(db, user_protocol_id)
    if not db_protocol:
        return False

    db.delete(db_protocol)
    db.commit()

    return True


def get_user_protocol_progress(db: Session, user_protocol_id: UUID) -> Dict[str, Any]:
    """Get progress information for a user protocol."""
    db_obj = get_user_protocol(db, user_protocol_id)
    if not db_obj:
        return {}

    # Calculate progress
    progress = {}

    # Calculate days elapsed
    start_date = db_obj.start_date.date() if db_obj.start_date else None
    today = date.today()

    days_elapsed = 0
    if start_date:
        days_elapsed = (today - start_date).days

    # Compile progress information
    progress = {
        "user_protocol_id": db_obj.id,
        "protocol_name": db_obj.name,
        "status": db_obj.status,
        "start_date": start_date,
        "end_date": db_obj.end_date,
        "days_elapsed": days_elapsed,
        "target_metrics": db_obj.target_metrics,
    }

    return progress


def get_user_protocol_effectiveness(db: Session, user_protocol_id: UUID, evaluation_period_days: int = 7) -> Dict[str, Any]:
    """
    Get effectiveness information for a user protocol.

    Args:
        db: Database session
        user_protocol_id: ID of the user protocol
        evaluation_period_days: Number of days to use for evaluation

    Returns:
        Dictionary with effectiveness metrics
    """
    from app.services.protocol_effectiveness import calculate_protocol_effectiveness

    return calculate_protocol_effectiveness(db=db, user_protocol_id=user_protocol_id, evaluation_period_days=evaluation_period_days)


def get_user_protocol_recommendations(db: Session, user_protocol_id: UUID) -> Dict[str, Any]:
    """
    Get recommendations for protocol adjustments based on effectiveness.

    Args:
        db: Database session
        user_protocol_id: ID of the user protocol

    Returns:
        Dictionary with recommendations
    """
    from app.services.protocol_effectiveness import generate_protocol_recommendations

    return generate_protocol_recommendations(db=db, user_protocol_id=user_protocol_id)


async def get_user_protocol_ai_analysis(db: Session, user_protocol_id: UUID) -> Dict[str, Any]:
    """
    Get AI analysis of protocol effectiveness.

    Args:
        db: Database session
        user_protocol_id: ID of the user protocol

    Returns:
        Dictionary with AI analysis of protocol effectiveness
    """
    from app.services.protocol_effectiveness import analyze_protocol_effectiveness_with_ai

    return await analyze_protocol_effectiveness_with_ai(db=db, user_protocol_id=user_protocol_id)


async def get_user_protocol_ai_adjustments(db: Session, user_protocol_id: UUID) -> Dict[str, Any]:
    """
    Get AI-generated protocol adjustment recommendations.

    Args:
        db: Database session
        user_protocol_id: ID of the user protocol

    Returns:
        Dictionary with AI-generated protocol adjustments
    """
    from app.services.protocol_effectiveness import generate_protocol_adjustments_with_ai

    return await generate_protocol_adjustments_with_ai(db=db, user_protocol_id=user_protocol_id)


def create_user_protocol(db: Session, user_id: str, protocol: UserProtocolCreateAndEnroll) -> UserProtocol:
    """
    Create a new protocol for a user, either from a template or custom.

    Args:
        db: Database session
        user_id: ID of the user
        protocol: Protocol creation data

    Returns:
        Created UserProtocol object
    """
    protocol_id = uuid.uuid4()

    # Create protocol object
    db_protocol = UserProtocol(
        id=protocol_id,
        user_id=user_id,
        name=protocol.name,
        description=protocol.description,
        start_date=protocol.start_date or datetime.now(),
        end_date=None,
        status="active",
        template_id=None,
        target_metrics=protocol.target_metrics,
        steps=protocol.steps or [],
        recommendations=protocol.recommendations or [],
        expected_outcomes=protocol.expected_outcomes or [],
        category=protocol.category,
    )

    db.add(db_protocol)
    db.commit()
    db.refresh(db_protocol)

    return db_protocol


def calculate_end_date(protocol: UserProtocolCreateAndEnroll, template_details: Optional[Dict[str, Any]] = None) -> Optional[datetime]:
    """
    Calculate the end date for a protocol based on protocol data or template details.

    Args:
        protocol: Protocol creation data
        template_details: Template details if using a template

    Returns:
        Calculated end date or None for ongoing protocols
    """
    # If end date is explicitly provided, use it
    if hasattr(protocol, "end_date") and protocol.end_date:
        return protocol.end_date

    # If duration days is provided in protocol data
    if protocol.duration_days:
        return datetime.now() + timedelta(days=protocol.duration_days)

    # If using a template with fixed duration
    if template_details:
        duration_type = template_details.get("duration_type")
        duration_days = template_details.get("duration_days")

        if duration_type == "fixed" and duration_days:
            return datetime.now() + timedelta(days=duration_days)

    # Default to ongoing (no end date)
    return None


def get_user_protocol(db: Session, user_protocol_id: str) -> Optional[UserProtocol]:
    """
    Get a specific protocol by ID.

    Args:
        db: Database session
        user_protocol_id: ID of the user protocol

    Returns:
        UserProtocol object or None if not found
    """
    # Convert string ID to UUID if needed
    user_protocol_id = UUID(user_protocol_id) if isinstance(user_protocol_id, str) else user_protocol_id
    return db.query(UserProtocol).filter(UserProtocol.id == user_protocol_id).first()


def create_protocol_check_in(db: Session, user_protocol_id: str, check_in: CheckInCreate) -> ProtocolCheckIn:
    """
    Create a check-in for a user protocol.

    Args:
        db: Database session
        user_protocol_id: ID of the user protocol
        check_in: Check-in creation data

    Returns:
        Created ProtocolCheckIn object
    """
    check_in_id = str(uuid.uuid4())

    db_check_in = ProtocolCheckIn(
        id=check_in_id,
        user_protocol_id=user_protocol_id,
        date=check_in.date or datetime.now(),
        notes=check_in.notes,
        metrics=check_in.metrics,
        status=check_in.status,
    )

    db.add(db_check_in)
    db.commit()
    db.refresh(db_check_in)

    return db_check_in


def get_protocol_check_ins(db: Session, user_protocol_id: str) -> List[ProtocolCheckIn]:
    """
    Get all check-ins for a user protocol.

    Args:
        db: Database session
        user_protocol_id: ID of the user protocol

    Returns:
        List of ProtocolCheckIn objects
    """
    return db.query(ProtocolCheckIn).filter(ProtocolCheckIn.user_protocol_id == user_protocol_id).all()


def get_active_protocols(db: Session, user_id: UUID) -> List[UserProtocol]:
    """
    Get all active protocols for a user.

    Args:
        db: Database session
        user_id: ID of the user

    Returns:
        List of active UserProtocol objects
    """
    # Convert string user_id to UUID if needed
    user_id_uuid = UUID(user_id) if isinstance(user_id, str) else user_id

    # Use the get_user_protocols function with status filter
    user_protocols = get_user_protocols(db=db, user_id=user_id_uuid, status="active")

    return user_protocols


def get_completed_protocols(db: Session, user_id: UUID) -> List[UserProtocol]:
    """
    Get all completed protocols for a user.

    Args:
        db: Database session
        user_id: ID of the user

    Returns:
        List of completed UserProtocol objects
    """
    # Convert string user_id to UUID if needed
    user_id_uuid = UUID(user_id) if isinstance(user_id, str) else user_id

    # Use the get_user_protocols function with status filter
    user_protocols = get_user_protocols(db=db, user_id=user_id_uuid, status="completed")

    return user_protocols

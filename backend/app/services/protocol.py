from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.protocol import Protocol
from app.schemas.protocol import ProtocolCreate, ProtocolUpdate


def get_protocol(db: Session, protocol_id: UUID) -> Optional[Protocol]:
    """Get a protocol by ID."""
    return db.query(Protocol).filter(Protocol.id == protocol_id).first()


def get_protocols(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    target_metric: Optional[str] = None
) -> List[Protocol]:
    """Get all protocols with optional filtering by target metric."""
    query = db.query(Protocol)
    
    if target_metric:
        # Filter protocols that target the specified metric
        query = query.filter(Protocol.target_metrics.any(target_metric))
    
    return query.offset(skip).limit(limit).all()


def create_protocol(db: Session, protocol_in: ProtocolCreate) -> Protocol:
    """Create a new protocol."""
    db_obj = Protocol(
        name=protocol_in.name,
        description=protocol_in.description,
        target_metrics=protocol_in.target_metrics,
        duration_type=protocol_in.duration_type,
        duration_days=protocol_in.duration_days
    )
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_protocol(
    db: Session, 
    db_obj: Protocol, 
    protocol_in: ProtocolUpdate
) -> Protocol:
    """Update a protocol."""
    update_data = protocol_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_protocol(db: Session, protocol_id: UUID) -> None:
    """Delete a protocol."""
    db_obj = db.query(Protocol).get(protocol_id)
    if db_obj:
        db.delete(db_obj)
        db.commit()


def get_protocol_templates(db: Session) -> List[Dict[str, Any]]:
    """Get predefined protocol templates."""
    # Define protocol templates
    templates = [
        {
            "name": "Sleep Optimization Protocol",
            "description": "A protocol designed to improve sleep quality and consistency.",
            "target_metrics": ["sleep"],
            "duration_type": "fixed",
            "duration_days": 28,
            "template_id": "sleep_optimization"
        },
        {
            "name": "Activity Building Protocol",
            "description": "A protocol designed to gradually increase activity levels while maintaining recovery.",
            "target_metrics": ["activity", "heart_rate"],
            "duration_type": "fixed",
            "duration_days": 30,
            "template_id": "activity_building"
        },
        {
            "name": "Recovery Protocol",
            "description": "A protocol designed to optimize recovery after intense activity periods.",
            "target_metrics": ["sleep", "activity", "heart_rate"],
            "duration_type": "fixed",
            "duration_days": 14,
            "template_id": "recovery"
        }
    ]
    
    return templates


def create_protocol_from_template(
    db: Session, 
    template_id: str,
    customizations: Optional[Dict[str, Any]] = None
) -> Optional[Protocol]:
    """Create a protocol from a template with optional customizations."""
    templates = get_protocol_templates(db)
    
    # Find the template with the matching ID
    template = next((t for t in templates if t["template_id"] == template_id), None)
    if not template:
        return None
    
    # Apply customizations if provided
    if customizations:
        for key, value in customizations.items():
            if key in template and key != "template_id":
                template[key] = value
    
    # Create protocol from template
    protocol_data = {k: v for k, v in template.items() if k != "template_id"}
    protocol_in = ProtocolCreate(**protocol_data)
    
    return create_protocol(db, protocol_in) 
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.api.endpoints.auth import get_current_active_user
from app.db.session import get_db
from app.schemas.protocol import Protocol as ProtocolSchema
from app.schemas.protocol import ProtocolCreate, ProtocolTemplate, ProtocolTemplateCustomization, ProtocolUpdate
from app.schemas.user import User as UserSchema
from app.services.protocol import (
    create_protocol,
    create_protocol_from_template,
    delete_protocol,
    get_protocol,
    get_protocol_effectiveness_metrics,
    get_protocol_template_details,
    get_protocol_templates,
    get_protocols,
    update_protocol,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/", response_model=List[ProtocolSchema])
def read_protocols(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    target_metric: Optional[str] = None,
    current_user: UserSchema = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve protocols.
    """
    protocols = get_protocols(db=db, skip=skip, limit=limit, target_metric=target_metric)
    return protocols


@router.post("/", response_model=ProtocolSchema)
def create_protocol_endpoint(
    *, db: Session = Depends(get_db), protocol_in: ProtocolCreate, current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Create new protocol.
    """
    protocol = create_protocol(db=db, protocol_in=protocol_in)
    return protocol


@router.get("/{protocol_id}", response_model=ProtocolSchema)
def read_protocol(*, db: Session = Depends(get_db), protocol_id: UUID, current_user: UserSchema = Depends(get_current_active_user)) -> Any:
    """
    Get protocol by ID.
    """
    protocol = get_protocol(db=db, protocol_id=protocol_id)
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")
    return protocol


@router.put("/{protocol_id}", response_model=ProtocolSchema)
def update_protocol_endpoint(
    *,
    db: Session = Depends(get_db),
    protocol_id: UUID,
    protocol_in: ProtocolUpdate,
    current_user: UserSchema = Depends(get_current_active_user),
) -> Any:
    """
    Update a protocol.
    """
    protocol = get_protocol(db=db, protocol_id=protocol_id)
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")

    protocol = update_protocol(db=db, db_obj=protocol, protocol_in=protocol_in)
    return protocol


@router.delete("/{protocol_id}", response_model=dict)
def delete_protocol_endpoint(
    *, db: Session = Depends(get_db), protocol_id: UUID, current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Delete a protocol.
    """
    protocol = get_protocol(db=db, protocol_id=protocol_id)
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")

    delete_protocol(db=db, protocol_id=protocol_id)
    return {"message": "Protocol deleted successfully"}


@router.get("/templates/list", response_model=List[ProtocolTemplate])
def read_protocol_templates(*, db: Session = Depends(get_db), current_user: UserSchema = Depends(get_current_active_user)) -> Any:
    """
    Retrieve available protocol templates.
    """
    templates = get_protocol_templates(db)
    return templates


@router.post("/templates/create", response_model=ProtocolSchema)
def create_from_template(
    *,
    db: Session = Depends(get_db),
    template_customization: ProtocolTemplateCustomization,
    current_user: UserSchema = Depends(get_current_active_user),
) -> Any:
    """
    Create a protocol from a template.
    """
    protocol = create_protocol_from_template(
        db=db, template_id=template_customization.template_id, customizations=template_customization.dict(exclude={"template_id"})
    )

    if not protocol:
        raise HTTPException(status_code=404, detail=f"Template with ID {template_customization.template_id} not found")

    return protocol


@router.get("/templates/{template_id}/details", response_model=Dict[str, Any])
def get_template_details(
    *, db: Session = Depends(get_db), template_id: str, current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Get detailed information about a protocol template.
    """
    # Check if the template exists
    templates = get_protocol_templates(db)
    template_exists = any(t["template_id"] == template_id for t in templates)

    if not template_exists:
        raise HTTPException(status_code=404, detail=f"Template with ID {template_id} not found")

    details = get_protocol_template_details(template_id)
    return details


@router.get("/{protocol_id}/effectiveness-metrics", response_model=Dict[str, Any])
def get_effectiveness_metrics(
    *, db: Session = Depends(get_db), protocol_id: UUID, current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Get effectiveness metrics for a protocol.
    """
    # Check if the protocol exists
    protocol = get_protocol(db=db, protocol_id=protocol_id)
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")

    metrics = get_protocol_effectiveness_metrics(protocol_id=protocol_id, db=db)
    return metrics

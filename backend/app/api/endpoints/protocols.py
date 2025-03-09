from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.endpoints.auth import get_current_active_user
from app.services.protocol import (
    get_protocol,
    get_protocols,
    create_protocol,
    update_protocol,
    delete_protocol,
    get_protocol_templates,
    create_protocol_from_template
)
from app.schemas.protocol import (
    Protocol as ProtocolSchema,
    ProtocolCreate,
    ProtocolUpdate,
    ProtocolTemplate,
    ProtocolTemplateCustomization
)
from app.schemas.user import User as UserSchema

router = APIRouter()


@router.get("/", response_model=List[ProtocolSchema])
def read_protocols(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    target_metric: Optional[str] = None,
    current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Retrieve protocols.
    """
    protocols = get_protocols(
        db=db, 
        skip=skip, 
        limit=limit,
        target_metric=target_metric
    )
    return protocols


@router.post("/", response_model=ProtocolSchema)
def create_protocol_endpoint(
    *,
    db: Session = Depends(get_db),
    protocol_in: ProtocolCreate,
    current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Create new protocol.
    """
    protocol = create_protocol(db=db, protocol_in=protocol_in)
    return protocol


@router.get("/{protocol_id}", response_model=ProtocolSchema)
def read_protocol(
    *,
    db: Session = Depends(get_db),
    protocol_id: UUID,
    current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
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
    current_user: UserSchema = Depends(get_current_active_user)
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
    *,
    db: Session = Depends(get_db),
    protocol_id: UUID,
    current_user: UserSchema = Depends(get_current_active_user)
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
def read_protocol_templates(
    *,
    db: Session = Depends(get_db),
    current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Get available protocol templates.
    """
    templates = get_protocol_templates(db=db)
    return templates


@router.post("/templates/create", response_model=ProtocolSchema)
def create_from_template(
    *,
    db: Session = Depends(get_db),
    template_customization: ProtocolTemplateCustomization,
    current_user: UserSchema = Depends(get_current_active_user)
) -> Any:
    """
    Create a protocol from a template with optional customizations.
    """
    protocol = create_protocol_from_template(
        db=db,
        template_id=template_customization.template_id,
        customizations=template_customization.model_dump(exclude={"template_id"}, exclude_unset=True)
    )
    
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol template not found")
    
    return protocol 
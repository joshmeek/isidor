from typing import Any, Dict, List, Optional
from uuid import UUID

from app.api.endpoints.auth import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.protocol import Protocol as ProtocolSchema
from app.schemas.protocol import (
    ProtocolCreate,
    ProtocolResponse,
    ProtocolTemplate,
    ProtocolTemplateCustomization,
    ProtocolTemplateDetailResponse,
    ProtocolTemplateResponse,
    ProtocolUpdate,
)
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
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/templates", response_model=List[ProtocolTemplateResponse])
def list_protocol_templates(
    category: Optional[str] = Query(None, description="Filter templates by category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    List available protocol templates.

    Optionally filter by category.
    """
    templates = get_protocol_templates(category=category)
    return templates


@router.get("/templates/{template_id}", response_model=ProtocolTemplateDetailResponse)
def get_template_details(template_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Get detailed information about a specific protocol template.
    """
    template_details = get_protocol_template_details(template_id=template_id)
    if not template_details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Protocol template with ID {template_id} not found")
    return template_details


@router.post("", response_model=ProtocolResponse)
def create_new_protocol(protocol: ProtocolCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Create a new protocol.

    Can be created from a template or as a custom protocol.
    """
    try:
        if protocol.template_id:
            db_protocol = create_protocol_from_template(db=db, template_id=protocol.template_id)
        else:
            db_protocol = create_protocol(db=db, protocol_in=protocol)
        return db_protocol
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=List[ProtocolResponse])
def list_protocols(
    status: Optional[str] = Query(None, description="Filter by status (active, completed, paused)"),
    skip: int = Query(0, description="Number of records to skip"),
    limit: int = Query(100, description="Maximum number of records to return"),
    db: Session = Depends(get_db),
    current_user: UserSchema = Depends(get_current_active_user),
):
    """
    List all protocols.

    Optionally filter by status.
    """
    try:
        protocols = get_protocols(db, skip=skip, limit=limit, status=status)

        response_protocols = []
        for protocol in protocols:
            try:
                response_protocol = ProtocolResponse.model_validate(protocol)
                response_protocols.append(response_protocol)
            except Exception as e:
                print(f"Error converting protocol to response model: {str(e)}")
                continue

        return response_protocols
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error listing protocols: {str(e)}")


@router.get("/{protocol_id}", response_model=ProtocolResponse)
def get_single_protocol(protocol_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Get a specific protocol by ID.
    """
    db_protocol = get_protocol(db=db, protocol_id=protocol_id)
    if not db_protocol:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Protocol with ID {protocol_id} not found")

    return db_protocol


@router.put("/{protocol_id}", response_model=ProtocolResponse)
def update_existing_protocol(
    protocol_id: str, protocol_update: ProtocolUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
):
    """
    Update a specific protocol.
    """
    db_protocol = get_protocol(db=db, protocol_id=protocol_id)
    if not db_protocol:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Protocol with ID {protocol_id} not found")

    updated_protocol = update_protocol(db=db, protocol_id=protocol_id, protocol_update=protocol_update)
    return updated_protocol


@router.delete("/{protocol_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_protocol(protocol_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Delete a specific protocol.
    """
    db_protocol = get_protocol(db=db, protocol_id=protocol_id)
    if not db_protocol:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Protocol with ID {protocol_id} not found")

    delete_protocol(db=db, protocol_id=protocol_id)
    return None

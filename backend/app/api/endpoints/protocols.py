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
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.endpoints.auth import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.protocol import (
    ProtocolResponse, 
    ProtocolTemplateResponse,
    ProtocolTemplateDetailResponse,
    CheckInCreate,
    CheckInResponse
)
from app.services.user_protocol import (
    create_user_protocol,
    get_user_protocols,
    get_user_protocol,
    update_user_protocol,
    delete_user_protocol,
    create_protocol_check_in,
    get_protocol_check_ins,
    get_active_protocols,
    get_completed_protocols
)

router = APIRouter()


@router.get("/templates", response_model=List[ProtocolTemplateResponse])
def list_protocol_templates(
    category: Optional[str] = Query(None, description="Filter templates by category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List available protocol templates.
    
    Optionally filter by category.
    """
    templates = get_protocol_templates(category=category)
    return templates


@router.get("/templates/{template_id}", response_model=ProtocolTemplateDetailResponse)
def get_template_details(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get detailed information about a specific protocol template.
    """
    template_details = get_protocol_template_details(template_id=template_id)
    if not template_details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Protocol template with ID {template_id} not found"
        )
    return template_details


@router.post("", response_model=ProtocolResponse)
def create_protocol(
    protocol: ProtocolCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new protocol for the current user.
    
    Can be created from a template or as a custom protocol.
    """
    try:
        db_protocol = create_user_protocol(db=db, user_id=str(current_user.id), protocol=protocol)
        return db_protocol
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("", response_model=List[ProtocolResponse])
def list_protocols(
    status: Optional[str] = Query(None, description="Filter by status (active, completed, paused)"),
    skip: int = Query(0, description="Number of records to skip"),
    limit: int = Query(100, description="Maximum number of records to return"),
    db: Session = Depends(get_db),
    current_user: UserSchema = Depends(get_current_active_user)
):
    """
    List all protocols.
    
    Optionally filter by status.
    """
    try:
        # Log the user ID to help with debugging
        print(f"Listing protocols for user: {current_user.id}")
        print(f"Query parameters: status={status}, skip={skip}, limit={limit}")
        
        # Get protocols from the database
        if status == "active":
            print("Getting active protocols")
            protocols = get_active_protocols(db=db, user_id=current_user.id)
        elif status == "completed":
            print("Getting completed protocols")
            protocols = get_completed_protocols(db=db, user_id=current_user.id)
        else:
            print("Getting all protocols")
            protocols = get_protocols(db, skip=skip, limit=limit, status=status)
        
        print(f"Found {len(protocols)} protocols")
        
        # Convert protocols to response model
        response_protocols = []
        for protocol in protocols:
            try:
                response_protocol = ProtocolResponse.model_validate(protocol)
                response_protocols.append(response_protocol)
            except Exception as e:
                print(f"Error converting protocol to response model: {str(e)}")
                # Skip this protocol
                continue
        
        print(f"Returning {len(response_protocols)} protocols")
        return response_protocols
    except Exception as e:
        # Log any errors that occur
        print(f"Error listing protocols: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing protocols: {str(e)}"
        )


@router.get("/{protocol_id}", response_model=ProtocolResponse)
def get_protocol(
    protocol_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific protocol by ID.
    """
    db_protocol = get_user_protocol(db=db, protocol_id=protocol_id)
    if not db_protocol:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Protocol with ID {protocol_id} not found"
        )
    
    # Check if protocol belongs to current user
    if str(db_protocol.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this protocol"
        )
    
    return db_protocol


@router.put("/{protocol_id}", response_model=ProtocolResponse)
def update_protocol(
    protocol_id: str,
    protocol_update: ProtocolUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a specific protocol.
    """
    # Check if protocol exists and belongs to current user
    db_protocol = get_user_protocol(db=db, protocol_id=protocol_id)
    if not db_protocol:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Protocol with ID {protocol_id} not found"
        )
    
    if str(db_protocol.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this protocol"
        )
    
    # Update protocol
    updated_protocol = update_user_protocol(db=db, protocol_id=protocol_id, protocol_update=protocol_update)
    return updated_protocol


@router.delete("/{protocol_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_protocol(
    protocol_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a specific protocol.
    """
    # Check if protocol exists and belongs to current user
    db_protocol = get_user_protocol(db=db, protocol_id=protocol_id)
    if not db_protocol:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Protocol with ID {protocol_id} not found"
        )
    
    if str(db_protocol.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this protocol"
        )
    
    # Delete protocol
    delete_user_protocol(db=db, protocol_id=protocol_id)
    return None


@router.post("/{protocol_id}/check-ins", response_model=CheckInResponse)
def create_check_in(
    protocol_id: str,
    check_in: CheckInCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a check-in for a specific protocol.
    """
    # Check if protocol exists and belongs to current user
    db_protocol = get_user_protocol(db=db, protocol_id=protocol_id)
    if not db_protocol:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Protocol with ID {protocol_id} not found"
        )
    
    if str(db_protocol.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create check-ins for this protocol"
        )
    
    # Create check-in
    db_check_in = create_protocol_check_in(db=db, protocol_id=protocol_id, check_in=check_in)
    return db_check_in


@router.get("/{protocol_id}/check-ins", response_model=List[CheckInResponse])
def list_check_ins(
    protocol_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List check-ins for a specific protocol.
    """
    # Check if protocol exists and belongs to current user
    db_protocol = get_user_protocol(db=db, protocol_id=protocol_id)
    if not db_protocol:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Protocol with ID {protocol_id} not found"
        )
    
    if str(db_protocol.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view check-ins for this protocol"
        )
    
    # Get check-ins
    check_ins = get_protocol_check_ins(db=db, protocol_id=protocol_id)
    return check_ins

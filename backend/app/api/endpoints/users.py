from typing import Any, List
from uuid import UUID

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema
from app.schemas.user import UserCreate, UserUpdate
from app.services.user import create_user, delete_user, get_user, get_user_by_email, update_user
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter()


@router.post("/", response_model=UserSchema)
def create_user_endpoint(*, db: Session = Depends(get_db), user_in: UserCreate) -> Any:
    """
    Create new user.
    """
    user = get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(status_code=400, detail="The user with this email already exists in the system.")
    return create_user(db=db, obj_in=user_in)


@router.get("/{user_id}", response_model=UserSchema)
def read_user(*, db: Session = Depends(get_db), user_id: UUID) -> Any:
    """
    Get user by ID.
    """
    user = get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserSchema)
def update_user_endpoint(*, db: Session = Depends(get_db), user_id: UUID, user_in: UserUpdate) -> Any:
    """
    Update a user.
    """
    user = get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return update_user(db=db, db_obj=user, obj_in=user_in)


@router.delete("/{user_id}", response_model=bool)
def delete_user_endpoint(*, db: Session = Depends(get_db), user_id: UUID) -> Any:
    """
    Delete a user.
    """
    user = get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    delete_user(db=db, user_id=user_id)
    return True

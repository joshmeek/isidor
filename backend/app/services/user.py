from typing import Optional
from uuid import UUID

from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from sqlalchemy.orm import Session


def get_user(db: Session, user_id: UUID) -> Optional[User]:
    """Get a user by ID."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get a user by email."""
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, obj_in: UserCreate) -> User:
    """Create a new user."""
    # Hash the password if provided
    password_hash = get_password_hash(obj_in.password) if obj_in.password else ""

    # Create DB object
    db_obj = User(email=obj_in.email, password_hash=password_hash, preferences={})

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_user(db: Session, db_obj: User, obj_in: UserUpdate) -> User:
    """Update a user."""
    update_data = obj_in.model_dump(exclude_unset=True)

    # Hash the password if it's being updated
    if "password" in update_data and update_data["password"]:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))

    # Update the object
    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_user(db: Session, user_id: UUID) -> None:
    """Delete a user."""
    db_obj = db.query(User).get(user_id)
    if db_obj:
        db.delete(db_obj)
        db.commit()

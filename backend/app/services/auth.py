from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union
from uuid import UUID

from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.token import TokenPayload
from app.services.user import get_user, get_user_by_email
from jose import JWTError, jwt
from sqlalchemy.orm import Session


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate a user by email and password."""
    user = get_user_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def create_access_token(subject: Union[str, UUID], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Add a timestamp to ensure uniqueness
    timestamp = datetime.utcnow().timestamp()

    to_encode = {"exp": expire, "sub": str(subject), "iat": timestamp}  # Add issued at time to ensure uniqueness
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(subject: Union[str, UUID]) -> str:
    """Create a JWT refresh token."""
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    # Add a timestamp to ensure uniqueness
    timestamp = datetime.utcnow().timestamp()

    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh", "iat": timestamp}  # Add issued at time to ensure uniqueness
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def validate_access_token(token: str) -> Optional[TokenPayload]:
    """Validate a JWT access token and return the payload."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_data = TokenPayload(**payload)

        if datetime.fromtimestamp(token_data.exp) < datetime.utcnow():
            return None

        return token_data
    except JWTError:
        return None


def validate_refresh_token(token: str) -> Optional[TokenPayload]:
    """Validate a JWT refresh token and return the payload."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_data = TokenPayload(**payload)

        if datetime.fromtimestamp(token_data.exp) < datetime.utcnow():
            return None

        # Check if it's a refresh token
        if not payload.get("type") or payload.get("type") != "refresh":
            return None

        return token_data
    except JWTError:
        return None


def get_current_user(db: Session, token: str) -> Optional[User]:
    """Get the current user from a JWT token."""
    token_data = validate_access_token(token)
    if not token_data:
        return None

    user = get_user(db, UUID(token_data.sub))
    if not user:
        return None

    return user


def change_password(db: Session, user_id: UUID, current_password: str, new_password: str) -> bool:
    """Change a user's password."""
    user = get_user(db, user_id)
    if not user:
        return False

    # Verify current password
    if not verify_password(current_password, user.password_hash):
        return False

    # Update password
    user.password_hash = get_password_hash(new_password)
    db.commit()

    return True


def request_password_reset(db: Session, email: str) -> Optional[str]:
    """Request a password reset and return a reset token."""
    user = get_user_by_email(db, email)
    if not user:
        return None

    # Create a short-lived token for password reset
    expire = datetime.utcnow() + timedelta(hours=1)
    timestamp = datetime.utcnow().timestamp()

    to_encode = {"exp": expire, "sub": str(user.id), "type": "reset", "iat": timestamp}  # Add issued at time to ensure uniqueness
    reset_token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return reset_token


def reset_password(db: Session, token: str, new_password: str) -> bool:
    """Reset a user's password using a reset token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

        # Check if it's a reset token
        if not payload.get("type") or payload.get("type") != "reset":
            return False

        # Check if token is expired
        token_data = TokenPayload(**payload)
        if datetime.fromtimestamp(token_data.exp) < datetime.utcnow():
            return False

        # Get the user and update password
        user = get_user(db, UUID(token_data.sub))
        if not user:
            return False

        user.password_hash = get_password_hash(new_password)
        db.commit()

        return True
    except JWTError:
        return False

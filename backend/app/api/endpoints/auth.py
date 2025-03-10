from typing import Any
from uuid import UUID

from app.db.session import get_db
from app.schemas.token import ChangePassword, PasswordReset, PasswordResetConfirm, RefreshToken, Token
from app.schemas.user import User as UserSchema
from app.services.auth import (
    authenticate_user,
    change_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
    request_password_reset,
    reset_password,
    validate_refresh_token,
)
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

router = APIRouter()

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# Dependency to get the current user
def get_current_active_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> UserSchema:
    """Get the current active user from the token."""
    user = get_current_user(db, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post("/login", response_model=Token)
def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@router.post("/refresh", response_model=Token)
def refresh_access_token(db: Session = Depends(get_db), refresh_token_in: RefreshToken = None) -> Any:
    """
    Refresh access token.
    """
    if not refresh_token_in:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Refresh token is required")

    token_data = validate_refresh_token(refresh_token_in.refresh_token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create new tokens
    user_id = UUID(token_data.sub)
    access_token = create_access_token(subject=user_id)
    refresh_token = create_refresh_token(subject=user_id)

    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@router.post("/password-reset", response_model=dict)
def request_password_reset_endpoint(reset_request: PasswordReset, db: Session = Depends(get_db)) -> Any:
    """
    Request a password reset.
    """
    reset_token = request_password_reset(db, reset_request.email)

    # Always return success, even if email doesn't exist (for security)
    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/password-reset/confirm", response_model=dict)
def reset_password_endpoint(reset_confirm: PasswordResetConfirm, db: Session = Depends(get_db)) -> Any:
    """
    Reset password with token.
    """
    success = reset_password(db, reset_confirm.token, reset_confirm.new_password)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    return {"message": "Password has been reset successfully"}


@router.post("/password-change", response_model=dict)
def change_password_endpoint(
    password_change: ChangePassword, current_user: UserSchema = Depends(get_current_active_user), db: Session = Depends(get_db)
) -> Any:
    """
    Change current user's password.
    """
    success = change_password(db, current_user.id, password_change.current_password, password_change.new_password)

    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password")

    return {"message": "Password changed successfully"}


@router.get("/me", response_model=UserSchema)
def read_users_me(current_user: UserSchema = Depends(get_current_active_user)) -> Any:
    """
    Get current user.
    """
    return current_user

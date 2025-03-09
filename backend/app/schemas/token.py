from typing import Optional
from pydantic import BaseModel, ConfigDict


class Token(BaseModel):
    """Token schema for response."""
    access_token: str
    refresh_token: str
    token_type: str


class TokenPayload(BaseModel):
    """Token payload schema."""
    sub: str
    exp: int
    iat: Optional[float] = None
    type: Optional[str] = None


class RefreshToken(BaseModel):
    """Refresh token schema for request."""
    refresh_token: str


class PasswordReset(BaseModel):
    """Password reset request schema."""
    email: str


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation schema."""
    token: str
    new_password: str


class ChangePassword(BaseModel):
    """Change password schema."""
    current_password: str
    new_password: str 
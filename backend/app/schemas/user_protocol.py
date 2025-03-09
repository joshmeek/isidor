from typing import Optional, Dict, Any
from uuid import UUID
from datetime import date
from pydantic import BaseModel, ConfigDict

from app.schemas.protocol import Protocol


class UserProtocolBase(BaseModel):
    """Base user protocol schema."""
    user_id: UUID
    protocol_id: UUID
    start_date: date
    end_date: Optional[date] = None
    status: str  # "active", "completed", "paused", "cancelled"


class UserProtocolCreate(BaseModel):
    """User protocol creation schema."""
    protocol_id: UUID
    start_date: Optional[date] = None


class UserProtocolUpdate(BaseModel):
    """User protocol update schema."""
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None


class UserProtocolInDBBase(UserProtocolBase):
    """User protocol in DB base schema."""
    id: UUID

    model_config = ConfigDict(from_attributes=True)


class UserProtocol(UserProtocolInDBBase):
    """User protocol schema for response."""
    pass


class UserProtocolWithProtocol(UserProtocol):
    """User protocol with protocol details."""
    protocol: Protocol


class UserProtocolProgress(BaseModel):
    """User protocol progress schema."""
    user_protocol_id: UUID
    protocol_id: UUID
    protocol_name: str
    status: str
    start_date: date
    end_date: Optional[date] = None
    days_elapsed: int
    days_remaining: Optional[int] = None
    completion_percentage: Optional[int] = None
    duration_type: str
    duration_days: Optional[int] = None
    target_metrics: list[str]


class UserProtocolStatusUpdate(BaseModel):
    """User protocol status update schema."""
    status: str 
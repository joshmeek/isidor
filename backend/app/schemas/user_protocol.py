from datetime import date, datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UserProtocolBase(BaseModel):
    """Base user protocol schema."""

    user_id: UUID
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    status: str  # "active", "completed", "paused", "cancelled"
    template_id: Optional[str] = None
    target_metrics: List[Any] = Field(default_factory=list)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)
    steps: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    expected_outcomes: List[str] = Field(default_factory=list)
    category: Optional[str] = None


class UserProtocolCreate(BaseModel):
    """User protocol creation schema."""

    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    target_metrics: List[str] = Field(default_factory=list)
    steps: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    expected_outcomes: Optional[List[str]] = None
    category: Optional[str] = None
    template_id: Optional[str] = None


class UserProtocolUpdate(BaseModel):
    """User protocol update schema."""

    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    target_metrics: Optional[List[str]] = None
    steps: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    expected_outcomes: Optional[List[str]] = None
    category: Optional[str] = None
    template_id: Optional[str] = None


class UserProtocolInDBBase(BaseModel):
    """User protocol in DB base schema."""

    id: UUID
    user_id: UUID
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    status: str
    template_id: Optional[str] = None
    target_metrics: List[Any]
    custom_fields: Dict[str, Any]
    steps: List[str]
    recommendations: List[str]
    expected_outcomes: List[str]
    category: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProtocol(UserProtocolInDBBase):
    """User protocol schema for response."""

    pass


class UserProtocolProgress(BaseModel):
    """User protocol progress schema."""

    user_protocol_id: UUID
    protocol_name: str
    status: str
    start_date: date
    end_date: Optional[date] = None
    days_elapsed: int
    target_metrics: List[str]


class UserProtocolStatusUpdate(BaseModel):
    """User protocol status update schema."""

    status: str


class UserProtocolCreateAndEnroll(BaseModel):
    """Schema for creating a protocol and automatically enrolling the user."""

    name: str
    description: str
    duration_days: int
    target_metrics: List[str]
    steps: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    expected_outcomes: Optional[List[str]] = None
    category: Optional[str] = None
    start_date: Optional[date] = None
    template_id: Optional[str] = None


class UserProtocolCheckIn(BaseModel):
    """Schema for a user protocol check-in."""

    id: UUID
    user_protocol_id: UUID
    date: datetime
    notes: Optional[str] = None
    metrics: Dict[str, Any]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

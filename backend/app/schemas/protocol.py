from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CheckInCreate(BaseModel):
    """Schema for creating a protocol check-in"""

    date: Optional[datetime] = None
    notes: Optional[str] = None
    metrics: Dict[str, Any] = Field(default_factory=dict)
    status: str = "completed"


class CheckInResponse(CheckInCreate):
    """Schema for protocol check-in response"""

    id: UUID
    protocol_id: UUID

    model_config = ConfigDict(from_attributes=True)


class ProtocolBase(BaseModel):
    """Base schema for protocols"""

    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    duration_days: Optional[int] = None
    target_metrics: Optional[List[str]] = None
    custom_fields: Optional[Dict[str, Any]] = None
    steps: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    expected_outcomes: Optional[List[str]] = None
    category: Optional[str] = None


class ProtocolCreate(ProtocolBase):
    """Schema for creating a protocol"""

    template_id: Optional[str] = None


class ProtocolUpdate(ProtocolBase):
    """Schema for updating a protocol"""

    status: Optional[str] = None


class ProtocolResponse(BaseModel):
    """Schema for protocol response"""

    id: UUID
    name: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    duration_days: Optional[int] = None
    target_metrics: List[str]
    steps: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    expected_outcomes: Optional[List[str]] = None
    category: Optional[str] = None
    status: str
    template_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    user_id: UUID

    model_config = ConfigDict(from_attributes=True)


class ProtocolTemplateBase(BaseModel):
    """Base schema for protocol templates"""

    id: str
    name: str
    description: str
    category: str
    target_metrics: List[str]
    duration_type: str
    duration_days: Optional[int] = None


class ProtocolTemplateResponse(ProtocolTemplateBase):
    """Schema for protocol template response"""

    pass


class ProtocolTemplateDetailResponse(ProtocolTemplateBase):
    """Schema for detailed protocol template response"""

    steps: List[str]
    recommendations: List[str]
    expected_outcomes: List[str]


class ProtocolInDBBase(ProtocolBase):
    """Protocol in DB base schema."""

    id: UUID

    model_config = ConfigDict(from_attributes=True)


class Protocol(BaseModel):
    """Protocol schema for response."""

    id: UUID
    name: str
    description: Optional[str] = None
    target_metrics: List[str]
    duration_type: str
    duration_days: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class ProtocolTemplate(BaseModel):
    """Protocol template schema."""

    template_id: str
    name: str
    description: str
    target_metrics: List[str]
    duration_type: str
    duration_days: Optional[int] = None


class ProtocolTemplateCustomization(BaseModel):
    """Protocol template customization schema."""

    template_id: str
    name: Optional[str] = None
    description: Optional[str] = None
    target_metrics: Optional[List[str]] = None
    duration_type: Optional[str] = None
    duration_days: Optional[int] = None

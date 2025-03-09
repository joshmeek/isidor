from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class ProtocolBase(BaseModel):
    """Base protocol schema."""
    name: str
    description: Optional[str] = None
    target_metrics: List[str]
    duration_type: str  # "fixed" or "ongoing"
    duration_days: Optional[int] = None


class ProtocolCreate(ProtocolBase):
    """Protocol creation schema."""
    pass


class ProtocolUpdate(BaseModel):
    """Protocol update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    target_metrics: Optional[List[str]] = None
    duration_type: Optional[str] = None
    duration_days: Optional[int] = None


class ProtocolInDBBase(ProtocolBase):
    """Protocol in DB base schema."""
    id: UUID

    model_config = ConfigDict(from_attributes=True)


class Protocol(ProtocolInDBBase):
    """Protocol schema for response."""
    pass


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
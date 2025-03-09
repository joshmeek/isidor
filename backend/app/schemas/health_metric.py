from datetime import date
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# Shared properties
class HealthMetricBase(BaseModel):
    date: date
    metric_type: str
    value: Dict[str, Any]
    source: str


# Properties to receive via API on creation
class HealthMetricCreate(HealthMetricBase):
    user_id: UUID


# Properties to receive via API on update
class HealthMetricUpdate(BaseModel):
    date: Optional[date] = None
    metric_type: Optional[str] = None
    value: Optional[Dict[str, Any]] = None
    source: Optional[str] = None


# Properties shared by models stored in DB
class HealthMetricInDBBase(HealthMetricBase):
    id: UUID
    user_id: UUID
    embedding: Optional[List[float]] = None

    model_config = ConfigDict(from_attributes=True)


# Properties to return via API
class HealthMetric(HealthMetricInDBBase):
    pass


# Schema for vector similarity search
class HealthMetricSimilaritySearch(BaseModel):
    query: str
    metric_type: Optional[str] = None
    limit: int = 10
    min_similarity: float = 0.7

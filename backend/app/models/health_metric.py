import uuid
from datetime import date
from sqlalchemy import Column, String, Date, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from app.db.session import Base


class HealthMetric(Base):
    __tablename__ = "health_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, server_default=text("CURRENT_DATE"))
    metric_type = Column(String, nullable=False)  # e.g., "sleep", "activity", "heart_rate"
    value = Column(JSONB, nullable=False)  # Flexible storage for various metric types
    source = Column(String, nullable=False)  # e.g., "healthkit", "manual", "oura"
    embedding = Column(Vector(384), nullable=True)  # Vector embedding for semantic search
    
    # Relationship
    user = relationship("User", back_populates="health_metrics") 
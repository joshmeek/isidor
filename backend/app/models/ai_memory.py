import uuid
from datetime import datetime

from app.db.session import Base
from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, DateTime, ForeignKey, Text, text, JSON, String, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship


class AIMemory(Base):
    __tablename__ = "ai_memory"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    summary = Column(Text, nullable=False)
    last_updated = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    embedding = Column(Vector(384), nullable=True)  # Vector embedding for semantic retrieval
    version_num = Column(Integer, nullable=False, server_default=text("1"))  # Version number for ordering

    # Relationship
    user = relationship("User", back_populates="ai_memory")


class AICachedResponse(Base):
    """
    Model to store cached AI responses to avoid redundant LLM calls.
    """
    __tablename__ = "ai_cached_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Request parameters
    endpoint = Column(String, nullable=False)  # e.g., "health_insight", "trend_analysis"
    time_frame = Column(String, nullable=False)  # e.g., "last_day", "last_week"
    query_hash = Column(String, nullable=False)  # Hash of the query and other parameters
    
    # Response data
    response_data = Column(JSON, nullable=False)  # The actual response
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    expires_at = Column(DateTime, nullable=False)  # When this cache entry expires
    
    # Metadata
    metric_types = Column(JSON, nullable=True)  # Which metric types were included
    
    # Relationship
    user = relationship("User", back_populates="ai_cached_responses")

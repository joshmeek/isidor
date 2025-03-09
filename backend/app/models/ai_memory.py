import uuid
from datetime import datetime

from app.db.session import Base
from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, DateTime, ForeignKey, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship


class AIMemory(Base):
    __tablename__ = "ai_memory"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    summary = Column(Text, nullable=False)
    last_updated = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    embedding = Column(Vector(384), nullable=True)  # Vector embedding for semantic retrieval

    # Relationship
    user = relationship("User", back_populates="ai_memory")

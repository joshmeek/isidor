import uuid

from app.db.session import Base
from sqlalchemy import JSON, Column, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    preferences = Column(JSONB, nullable=True)  # Stores user preferences as JSON

    # Relationships
    health_metrics = relationship("HealthMetric", back_populates="user", cascade="all, delete-orphan")
    protocols = relationship("UserProtocol", back_populates="user", cascade="all, delete-orphan")
    ai_memory = relationship("AIMemory", back_populates="user", cascade="all, delete-orphan", uselist=False)
    ai_cached_responses = relationship("AICachedResponse", back_populates="user", cascade="all, delete-orphan")

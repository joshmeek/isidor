import uuid

from app.db.session import Base
from sqlalchemy import ARRAY, Column, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship


class Protocol(Base):
    __tablename__ = "protocols"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    target_metrics = Column(ARRAY(String), nullable=False)  # Array of metric types this protocol targets
    duration_type = Column(String, nullable=False)  # e.g., "fixed", "ongoing"
    duration_days = Column(Integer, nullable=True)  # For fixed duration protocols

    # Relationships
    user_protocols = relationship("UserProtocol", back_populates="protocol", cascade="all, delete-orphan")

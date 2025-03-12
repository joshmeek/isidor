import uuid
from datetime import date

from app.db.session import Base
from sqlalchemy import JSON, Column, Date, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class UserProtocol(Base):
    __tablename__ = "user_protocols"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    end_date = Column(DateTime, nullable=True)
    status = Column(String, nullable=False, server_default=text("'active'"))  # active, completed, paused
    template_id = Column(String, nullable=True)  # Reference to a protocol template if used
    target_metrics = Column(JSON, nullable=False, server_default=text("'[]'"))
    custom_fields = Column(JSON, nullable=False, server_default=text("'{}'"))
    steps = Column(JSON, nullable=False, server_default=text("'[]'"))
    recommendations = Column(JSON, nullable=False, server_default=text("'[]'"))
    expected_outcomes = Column(JSON, nullable=False, server_default=text("'[]'"))
    category = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="protocols")
    check_ins = relationship("ProtocolCheckIn", back_populates="user_protocol", cascade="all, delete-orphan")

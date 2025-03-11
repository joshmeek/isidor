from app.db.session import Base
from sqlalchemy import JSON, Column, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class ProtocolCheckIn(Base):
    """Protocol check-in model for tracking user progress."""

    __tablename__ = "protocol_check_ins"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    protocol_id = Column(UUID(as_uuid=True), ForeignKey("user_protocols.id"), nullable=False)
    date = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    notes = Column(Text, nullable=True)
    metrics = Column(JSON, nullable=False, server_default=text("'{}'"))
    status = Column(String, nullable=False, server_default=text("'completed'"))  # completed, missed, partial
    created_at = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), onupdate=func.now())

    # Relationships
    protocol = relationship("UserProtocol", back_populates="check_ins")

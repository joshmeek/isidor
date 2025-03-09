import uuid
from datetime import date

from app.db.session import Base
from sqlalchemy import Column, Date, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship


class UserProtocol(Base):
    __tablename__ = "user_protocols"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    protocol_id = Column(UUID(as_uuid=True), ForeignKey("protocols.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(Date, nullable=False, server_default=text("CURRENT_DATE"))
    end_date = Column(Date, nullable=True)
    status = Column(String, nullable=False, server_default=text("'active'"))  # e.g., "active", "completed", "paused"

    # Relationships
    user = relationship("User", back_populates="protocols")
    protocol = relationship("Protocol", back_populates="user_protocols")

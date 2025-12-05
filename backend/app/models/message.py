from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Message(Base):
    """Chat messages between inventor and attorney on a disclosure"""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    disclosure_id = Column(Integer, ForeignKey("disclosures.id"), nullable=False, index=True)

    # Sender of the message
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Message content
    content = Column(Text, nullable=False)

    # Read status
    is_read = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    disclosure = relationship("Disclosure", back_populates="messages")
    sender = relationship("User", back_populates="messages")

    def __repr__(self):
        return f"<Message(id={self.id}, disclosure_id={self.disclosure_id}, sender_id={self.sender_id})>"

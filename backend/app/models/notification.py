from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class NotificationType(str, enum.Enum):
    """Notification type enumeration"""
    DISCLOSURE_CREATED = "DISCLOSURE_CREATED"
    DISCLOSURE_UPDATED = "DISCLOSURE_UPDATED"
    DISCLOSURE_STATUS_CHANGED = "DISCLOSURE_STATUS_CHANGED"
    COMMENT_ADDED = "COMMENT_ADDED"
    COMMENT_REPLY = "COMMENT_REPLY"
    LAWYER_ASSIGNED = "LAWYER_ASSIGNED"
    DRAFT_READY = "DRAFT_READY"
    REVISION_REQUESTED = "REVISION_REQUESTED"
    APPROVED = "APPROVED"


class Notification(Base):
    """User notifications for disclosure activities"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Notification details
    type = Column(SQLEnum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)

    # Related entity references
    disclosure_id = Column(Integer, ForeignKey("disclosures.id"), nullable=True)
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=True)

    # Status
    read = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="notifications")

    def __repr__(self):
        return f"<Notification(id={self.id}, user_id={self.user_id}, type={self.type}, read={self.read})>"

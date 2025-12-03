from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class UserRole(str, enum.Enum):
    """User role enumeration"""
    INVENTOR = "INVENTOR"
    LAWYER = "LAWYER"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)

    # Profile information
    full_name = Column(String, nullable=True)
    company = Column(String, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    disclosures = relationship("Disclosure", back_populates="inventor", foreign_keys="Disclosure.inventor_id")
    assigned_disclosures = relationship("Disclosure", back_populates="assigned_lawyer", foreign_keys="Disclosure.assigned_lawyer_id")
    comments = relationship("Comment", back_populates="author")
    notifications = relationship("Notification", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"

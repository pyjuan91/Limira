from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class DisclosureStatus(str, enum.Enum):
    """Disclosure status enumeration"""
    DRAFT = "DRAFT"
    AI_PROCESSING = "AI_PROCESSING"
    READY_FOR_REVIEW = "READY_FOR_REVIEW"
    IN_REVIEW = "IN_REVIEW"
    REVISION_REQUESTED = "REVISION_REQUESTED"
    APPROVED = "APPROVED"


class DisclosureType(str, enum.Enum):
    """Type of disclosure"""
    NEW_DISCLOSURE = "NEW_DISCLOSURE"  # Traditional invention disclosure
    PATENT_REVIEW = "PATENT_REVIEW"    # Review of existing patent


class Disclosure(Base):
    __tablename__ = "disclosures"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    status = Column(SQLEnum(DisclosureStatus), default=DisclosureStatus.DRAFT, nullable=False)

    # Type of disclosure (new invention vs existing patent review)
    disclosure_type = Column(
        SQLEnum(DisclosureType),
        default=DisclosureType.NEW_DISCLOSURE,
        nullable=False
    )

    # Inventor who created this disclosure
    inventor_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Lawyer assigned to review (optional)
    assigned_lawyer_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Structured disclosure content (stored as JSON)
    # Example: {
    #   "problem": "...",
    #   "solution": "...",
    #   "technical_details": "...",
    #   "advantages": "...",
    #   "prior_art": "..."
    # }
    content = Column(JSON, nullable=False, default={})

    # For PATENT_REVIEW type: patent number and AI analysis results
    patent_number = Column(String, nullable=True)  # e.g., "US10,123,456"
    patent_file_id = Column(Integer, ForeignKey("files.id"), nullable=True)  # Reference to uploaded PDF
    ai_analysis = Column(JSON, nullable=True)  # AI analysis results

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    inventor = relationship("User", back_populates="disclosures", foreign_keys=[inventor_id])
    assigned_lawyer = relationship("User", back_populates="assigned_disclosures", foreign_keys=[assigned_lawyer_id])
    versions = relationship("DisclosureVersion", back_populates="disclosure", cascade="all, delete-orphan")
    patent_draft = relationship("PatentDraft", back_populates="disclosure", uselist=False, cascade="all, delete-orphan")
    files = relationship("File", back_populates="disclosure", foreign_keys="[File.disclosure_id]", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="disclosure", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="disclosure", cascade="all, delete-orphan")
    video_sessions = relationship("VideoSession", back_populates="disclosure", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Disclosure(id={self.id}, title={self.title}, status={self.status})>"


class DisclosureVersion(Base):
    """Version control for disclosure edits"""
    __tablename__ = "disclosure_versions"

    id = Column(Integer, primary_key=True, index=True)
    disclosure_id = Column(Integer, ForeignKey("disclosures.id"), nullable=False)
    version_number = Column(Integer, nullable=False)

    # Snapshot of disclosure content at this version
    content_snapshot = Column(JSON, nullable=False)

    # Who made this edit
    edited_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    edited_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    disclosure = relationship("Disclosure", back_populates="versions")
    editor = relationship("User")

    def __repr__(self):
        return f"<DisclosureVersion(disclosure_id={self.disclosure_id}, version={self.version_number})>"

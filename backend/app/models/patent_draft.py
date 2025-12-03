from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class AIProcessingStatus(str, enum.Enum):
    """AI processing status for patent draft generation"""
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class PatentDraft(Base):
    """AI-generated patent draft from disclosure"""
    __tablename__ = "patent_drafts"

    id = Column(Integer, primary_key=True, index=True)
    disclosure_id = Column(Integer, ForeignKey("disclosures.id"), unique=True, nullable=False)

    # AI processing status
    ai_processing_status = Column(SQLEnum(AIProcessingStatus), default=AIProcessingStatus.PENDING, nullable=False)

    # Structured patent sections (stored as JSON)
    # Example: {
    #   "background": "...",
    #   "summary": "...",
    #   "detailed_description": "...",
    #   "claims": ["Claim 1...", "Claim 2..."],
    #   "abstract": "..."
    # }
    sections = Column(JSON, nullable=False, default={})

    # Figure index (organized drawing references)
    # Example: {
    #   "figure_1": {"file_id": 123, "description": "System overview"},
    #   "figure_2": {"file_id": 124, "description": "Detailed view"}
    # }
    figure_index = Column(JSON, nullable=False, default={})

    # AI metadata
    ai_model_used = Column(String, nullable=True)  # e.g., "gpt-4", "claude-3-opus"
    processing_error = Column(Text, nullable=True)  # Error message if failed

    # Timestamps
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    disclosure = relationship("Disclosure", back_populates="patent_draft")

    def __repr__(self):
        return f"<PatentDraft(id={self.id}, disclosure_id={self.disclosure_id}, status={self.ai_processing_status})>"

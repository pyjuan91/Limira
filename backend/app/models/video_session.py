from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class VideoSession(Base):
    """Video chat sessions with AI transcription and notes"""
    __tablename__ = "video_sessions"

    id = Column(Integer, primary_key=True, index=True)
    disclosure_id = Column(Integer, ForeignKey("disclosures.id"), nullable=False)

    # Participants (stored as JSON array of user IDs)
    # Example: [1, 5] for inventor_id=1 and lawyer_id=5
    participants = Column(JSON, nullable=False, default=[])

    # Transcription and AI summary
    transcript_text = Column(Text, nullable=True)  # Full transcript
    ai_summary = Column(Text, nullable=True)  # AI-generated summary of discussion

    # Session metadata
    # Example: {"duration_seconds": 1800, "recording_url": "..."}
    session_metadata = Column(JSON, nullable=True, default={})

    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    disclosure = relationship("Disclosure", back_populates="video_sessions")

    def __repr__(self):
        return f"<VideoSession(id={self.id}, disclosure_id={self.disclosure_id})>"

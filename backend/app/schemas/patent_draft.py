from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, List
from app.models.patent_draft import AIProcessingStatus


# Request schemas
class DraftSectionUpdate(BaseModel):
    """Update specific section of patent draft"""
    section_name: str  # e.g., "background", "summary", "claims"
    content: Any  # Can be string or list (for claims)


class DraftFullTextUpdate(BaseModel):
    """Update full text of patent draft"""
    full_text: str


# Response schemas
class PatentDraftResponse(BaseModel):
    """Patent draft data response"""
    id: int
    disclosure_id: int
    ai_processing_status: AIProcessingStatus
    sections: Dict[str, Any]
    full_text: Optional[str] = None
    figure_index: Dict[str, Any]
    ai_model_used: Optional[str] = None
    processing_error: Optional[str] = None
    generated_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DraftApproval(BaseModel):
    """Lawyer approval of draft"""
    approved: bool = True
    notes: Optional[str] = None


class RevisionRequest(BaseModel):
    """Request revision from inventor"""
    feedback: str

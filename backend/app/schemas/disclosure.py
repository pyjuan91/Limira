from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any
from app.models.disclosure import DisclosureStatus, DisclosureType


# Request schemas
class DisclosureCreate(BaseModel):
    """Create new disclosure"""
    title: str = Field(..., min_length=1, max_length=200)
    disclosure_type: DisclosureType = Field(
        default=DisclosureType.NEW_DISCLOSURE,
        description="Type of disclosure: NEW_DISCLOSURE or PATENT_REVIEW"
    )
    content: Dict[str, Any] = Field(
        default={},
        description="Structured disclosure content: problem, solution, technical_details, etc."
    )
    assigned_lawyer_id: Optional[int] = Field(
        None,
        description="Optional: Assign a lawyer to this disclosure upon creation"
    )
    patent_number: Optional[str] = Field(
        None,
        description="For PATENT_REVIEW: the patent number (e.g., US10,123,456)"
    )


class DisclosureUpdate(BaseModel):
    """Update disclosure content"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[Dict[str, Any]] = None


class DisclosureStatusUpdate(BaseModel):
    """Update disclosure status"""
    status: DisclosureStatus


class LawyerAssignment(BaseModel):
    """Assign lawyer to disclosure"""
    lawyer_id: int


# Response schemas
class DisclosureResponse(BaseModel):
    """Disclosure data response"""
    id: int
    title: str
    status: DisclosureStatus
    disclosure_type: DisclosureType = DisclosureType.NEW_DISCLOSURE
    inventor_id: int
    assigned_lawyer_id: Optional[int] = None
    content: Dict[str, Any]
    patent_number: Optional[str] = None
    patent_file_id: Optional[int] = None
    ai_analysis: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DisclosureListResponse(BaseModel):
    """Disclosure list item (lightweight)"""
    id: int
    title: str
    status: DisclosureStatus
    disclosure_type: DisclosureType = DisclosureType.NEW_DISCLOSURE
    inventor_id: int
    assigned_lawyer_id: Optional[int] = None
    patent_number: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DisclosureVersionResponse(BaseModel):
    """Disclosure version history item"""
    id: int
    disclosure_id: int
    version_number: int
    content_snapshot: Dict[str, Any]
    edited_by: int
    edited_at: datetime

    class Config:
        from_attributes = True

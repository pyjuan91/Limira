from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any
from app.models.disclosure import DisclosureStatus


# Request schemas
class DisclosureCreate(BaseModel):
    """Create new disclosure"""
    title: str = Field(..., min_length=1, max_length=200)
    content: Dict[str, Any] = Field(
        default={},
        description="Structured disclosure content: problem, solution, technical_details, etc."
    )
    assigned_lawyer_id: Optional[int] = Field(
        None,
        description="Optional: Assign a lawyer to this disclosure upon creation"
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
    inventor_id: int
    assigned_lawyer_id: Optional[int] = None
    content: Dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DisclosureListResponse(BaseModel):
    """Disclosure list item (lightweight)"""
    id: int
    title: str
    status: DisclosureStatus
    inventor_id: int
    assigned_lawyer_id: Optional[int] = None
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

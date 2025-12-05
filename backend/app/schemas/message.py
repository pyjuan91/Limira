from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# Request schemas
class MessageCreate(BaseModel):
    """Create new message"""
    content: str = Field(..., min_length=1)


class MessageUpdate(BaseModel):
    """Update message read status"""
    is_read: bool = True


# Response schemas
class MessageResponse(BaseModel):
    """Message data response"""
    id: int
    disclosure_id: int
    sender_id: int
    content: str
    is_read: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Include sender info (will be joined from User model)
    sender_name: Optional[str] = None
    sender_role: Optional[str] = None

    class Config:
        from_attributes = True

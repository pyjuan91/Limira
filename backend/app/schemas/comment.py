from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


# Request schemas
class CommentCreate(BaseModel):
    """Create new comment"""
    content: str = Field(..., min_length=1)
    parent_comment_id: Optional[int] = None


class CommentUpdate(BaseModel):
    """Update comment content"""
    content: str = Field(..., min_length=1)


# Response schemas
class CommentResponse(BaseModel):
    """Comment data response"""
    id: int
    disclosure_id: int
    author_id: int
    content: str
    parent_comment_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Include author info (will be joined from User model)
    author_name: Optional[str] = None
    author_role: Optional[str] = None

    class Config:
        from_attributes = True


class CommentThreadResponse(BaseModel):
    """Comment with nested replies"""
    id: int
    disclosure_id: int
    author_id: int
    content: str
    parent_comment_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    author_name: Optional[str] = None
    author_role: Optional[str] = None
    replies: List["CommentThreadResponse"] = []

    class Config:
        from_attributes = True

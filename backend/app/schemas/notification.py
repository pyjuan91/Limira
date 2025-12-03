from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.notification import NotificationType


# Response schemas
class NotificationResponse(BaseModel):
    """Notification data response"""
    id: int
    user_id: int
    type: NotificationType
    title: str
    message: str
    disclosure_id: Optional[int] = None
    comment_id: Optional[int] = None
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationMarkRead(BaseModel):
    """Mark notification as read"""
    read: bool = True

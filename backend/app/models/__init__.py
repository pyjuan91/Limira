from app.core.database import Base
from app.models.user import User
from app.models.disclosure import Disclosure, DisclosureVersion
from app.models.patent_draft import PatentDraft
from app.models.file import File
from app.models.comment import Comment
from app.models.notification import Notification
from app.models.video_session import VideoSession

# Export all models for Alembic to detect
__all__ = [
    "Base",
    "User",
    "Disclosure",
    "DisclosureVersion",
    "PatentDraft",
    "File",
    "Comment",
    "Notification",
    "VideoSession",
]

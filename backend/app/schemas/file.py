from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any
from app.models.file import FileType


# Response schemas
class FileResponse(BaseModel):
    """File metadata response"""
    id: int
    disclosure_id: int
    file_type: FileType
    original_filename: str
    file_extension: str
    file_size: int
    uploaded_at: datetime
    file_metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class FileUploadResponse(BaseModel):
    """Response after file upload"""
    file_id: int
    upload_url: str  # Pre-signed S3 URL for upload
    download_url: Optional[str] = None


class FileDownloadResponse(BaseModel):
    """File download URL response"""
    download_url: str
    expires_in: int = 3600  # seconds

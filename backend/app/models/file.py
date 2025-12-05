from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class FileType(str, enum.Enum):
    """File type enumeration"""
    DRAWING = "DRAWING"  # PDF, PNG, JPG
    DOCUMENT = "DOCUMENT"  # DOCX, PDF
    IMAGE = "IMAGE"  # PNG, JPG, JPEG


class File(Base):
    """File attachments for disclosures"""
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    disclosure_id = Column(Integer, ForeignKey("disclosures.id"), nullable=False)

    # File metadata
    file_type = Column(SQLEnum(FileType), nullable=False)
    original_filename = Column(String, nullable=False)
    file_extension = Column(String, nullable=False)  # .pdf, .png, etc.
    file_size = Column(Integer, nullable=False)  # in bytes

    # S3 storage
    s3_key = Column(String, nullable=False, unique=True)  # S3 object key
    s3_bucket = Column(String, nullable=False)  # S3 bucket name

    # Additional metadata (optional)
    # Example: {"width": 1920, "height": 1080, "dpi": 300}
    file_metadata = Column(JSON, nullable=True, default={})

    # Timestamps
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    disclosure = relationship("Disclosure", back_populates="files", foreign_keys=[disclosure_id])

    def __repr__(self):
        return f"<File(id={self.id}, filename={self.original_filename}, type={self.file_type})>"

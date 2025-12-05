from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File as FastAPIFile
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.disclosure import Disclosure
from app.models.file import File, FileType
from app.schemas import FileResponse

router = APIRouter()


def get_file_type(extension: str) -> FileType:
    """Determine file type from extension"""
    ext = extension.lower()
    if ext in [".pdf"]:
        return FileType.DRAWING  # PDF can be drawings
    elif ext in [".png", ".jpg", ".jpeg"]:
        return FileType.IMAGE
    elif ext in [".docx", ".doc"]:
        return FileType.DOCUMENT
    else:
        return FileType.IMAGE  # Default


@router.post("/upload/{disclosure_id}", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    disclosure_id: int,
    file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Upload a file to a disclosure

    For MVP, files are stored locally. In production, use S3.
    """
    # Check disclosure exists and user has access
    disclosure = db.query(Disclosure).filter(Disclosure.id == disclosure_id).first()
    if not disclosure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disclosure not found")

    # Only inventor or admin can upload files
    if current_user.role == UserRole.INVENTOR and disclosure.inventor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Validate file extension
    file_extension = os.path.splitext(file.filename)[1]
    if file_extension not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed: {settings.ALLOWED_FILE_EXTENSIONS}"
        )

    # Validate file size
    file_content = await file.read()
    file_size = len(file_content)
    if file_size > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size: {settings.MAX_FILE_SIZE_MB}MB"
        )

    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_extension}"

    # For MVP: Save locally (in production, upload to S3)
    upload_dir = os.path.join(os.getcwd(), "uploads", str(disclosure_id))
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, unique_filename)
    with open(file_path, "wb") as f:
        f.write(file_content)

    # Create file record
    file_type = get_file_type(file_extension)
    new_file = File(
        disclosure_id=disclosure_id,
        file_type=file_type,
        original_filename=file.filename,
        file_extension=file_extension,
        file_size=file_size,
        s3_key=unique_filename,  # For MVP, just the filename
        s3_bucket="local",  # Placeholder
    )

    db.add(new_file)
    db.commit()
    db.refresh(new_file)

    return new_file


@router.get("/disclosure/{disclosure_id}/files", response_model=List[FileResponse])
def get_disclosure_files(
    disclosure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get all files for a disclosure
    """
    # Check disclosure exists and user has access
    disclosure = db.query(Disclosure).filter(Disclosure.id == disclosure_id).first()
    if not disclosure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disclosure not found")

    # Check permissions
    if current_user.role == UserRole.INVENTOR and disclosure.inventor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == UserRole.LAWYER and disclosure.assigned_lawyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    files = db.query(File).filter(File.disclosure_id == disclosure_id).all()
    return files


@router.get("/{file_id}/download")
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Download a file

    For MVP, returns local file path. In production, return S3 signed URL.
    """
    file_record = db.query(File).filter(File.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    # Check permissions
    disclosure = db.query(Disclosure).filter(Disclosure.id == file_record.disclosure_id).first()
    if current_user.role == UserRole.INVENTOR and disclosure.inventor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == UserRole.LAWYER and disclosure.assigned_lawyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # For MVP: Return file from local storage
    from fastapi.responses import FileResponse
    file_path = os.path.join(os.getcwd(), "uploads", str(file_record.disclosure_id), file_record.s3_key)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on server")

    return FileResponse(
        path=file_path,
        filename=file_record.original_filename,
        media_type="application/octet-stream"
    )


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete a file
    """
    file_record = db.query(File).filter(File.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    # Check permissions
    disclosure = db.query(Disclosure).filter(Disclosure.id == file_record.disclosure_id).first()
    if current_user.role not in [UserRole.ADMIN] and disclosure.inventor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Delete file from storage
    file_path = os.path.join(os.getcwd(), "uploads", str(file_record.disclosure_id), file_record.s3_key)
    if os.path.exists(file_path):
        os.remove(file_path)

    # Delete database record
    db.delete(file_record)
    db.commit()

    return None


@router.get("/{file_id}/preview")
def preview_file(
    file_id: int,
    db: Session = Depends(get_db),
    # Note: No auth for now to allow iframe embedding
    # In production, use signed URLs or session-based auth
):
    """
    Preview a PDF file inline (for embedding in iframe)
    """
    file_record = db.query(File).filter(File.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    # For MVP: Return file from local storage
    from fastapi.responses import FileResponse
    file_path = os.path.join(os.getcwd(), "uploads", str(file_record.disclosure_id), file_record.s3_key)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on server")

    # Determine media type
    media_type = "application/pdf" if file_record.file_extension.lower() == ".pdf" else "application/octet-stream"

    return FileResponse(
        path=file_path,
        filename=file_record.original_filename,
        media_type=media_type,
        headers={
            "Content-Disposition": f"inline; filename=\"{file_record.original_filename}\""
        }
    )

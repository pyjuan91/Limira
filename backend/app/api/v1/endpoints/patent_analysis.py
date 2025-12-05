from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File as FastAPIFile
from sqlalchemy.orm import Session
import os
import uuid
import pdfplumber
from typing import Dict, Any
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.services.ai_service import ai_service

router = APIRouter()


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text from PDF file using pdfplumber

    Args:
        pdf_path: Path to the PDF file

    Returns:
        Extracted text as string
    """
    text_content = []

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_content.append(text)

        return "\n\n".join(text_content)
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")


@router.post("/analyze", status_code=status.HTTP_200_OK)
async def analyze_patent_pdf(
    file: UploadFile = FastAPIFile(...),
    patent_number: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """
    Upload a patent PDF and get AI-powered analysis

    Args:
        file: PDF file to analyze
        patent_number: Optional patent number for reference
        current_user: Authenticated user

    Returns:
        Comprehensive patent analysis including summary, technical assessment,
        commercial value, and strategic insights
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported"
        )

    # Read file content
    file_content = await file.read()
    file_size = len(file_content)

    # Check file size (limit to 50MB for patents)
    if file_size > 50 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 50MB"
        )

    # Save file temporarily
    temp_dir = os.path.join(os.getcwd(), "temp_uploads")
    os.makedirs(temp_dir, exist_ok=True)

    temp_filename = f"{uuid.uuid4()}.pdf"
    temp_path = os.path.join(temp_dir, temp_filename)

    try:
        # Write file to disk
        with open(temp_path, "wb") as f:
            f.write(file_content)

        # Extract text from PDF
        try:
            patent_text = extract_text_from_pdf(temp_path)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to extract text from PDF: {str(e)}"
            )

        if not patent_text or len(patent_text.strip()) < 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract sufficient text from PDF. Please ensure the PDF contains readable text."
            )

        # Analyze patent using AI
        try:
            analysis = ai_service.analyze_patent(patent_text, patent_number)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI analysis failed: {str(e)}"
            )

        # Add metadata
        result = {
            "filename": file.filename,
            "patent_number": patent_number,
            "file_size": file_size,
            "extracted_text_length": len(patent_text),
            "analysis": analysis,
        }

        return result

    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass  # Ignore cleanup errors


@router.post("/quick-summary", status_code=status.HTTP_200_OK)
async def quick_patent_summary(
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, str]:
    """
    Get a quick summary of a patent PDF (faster, less detailed than full analysis)

    Args:
        file: PDF file to summarize
        current_user: Authenticated user

    Returns:
        Quick summary of the patent
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported"
        )

    # Read file content
    file_content = await file.read()

    # Save file temporarily
    temp_dir = os.path.join(os.getcwd(), "temp_uploads")
    os.makedirs(temp_dir, exist_ok=True)

    temp_filename = f"{uuid.uuid4()}.pdf"
    temp_path = os.path.join(temp_dir, temp_filename)

    try:
        # Write file to disk
        with open(temp_path, "wb") as f:
            f.write(file_content)

        # Extract text from PDF (first 5 pages only for speed)
        patent_text = []
        with pdfplumber.open(temp_path) as pdf:
            for i, page in enumerate(pdf.pages[:5]):  # Only first 5 pages
                text = page.extract_text()
                if text:
                    patent_text.append(text)

        text_content = "\n\n".join(patent_text)

        if not text_content or len(text_content.strip()) < 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract text from PDF"
            )

        # Generate quick summary
        summary = ai_service.summarize_video_transcript(
            f"Patent Document:\n\n{text_content[:5000]}"
        )

        return {
            "filename": file.filename,
            "summary": summary,
        }

    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

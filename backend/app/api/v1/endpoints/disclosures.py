from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_active_user, RoleChecker
from app.models.user import User, UserRole
from app.models.disclosure import Disclosure, DisclosureStatus, DisclosureVersion, DisclosureType
from app.models.file import File
from app.schemas import (
    DisclosureCreate,
    DisclosureUpdate,
    DisclosureResponse,
    DisclosureListResponse,
    DisclosureStatusUpdate,
    LawyerAssignment,
    DisclosureVersionResponse,
)
from app.services.ai_service import ai_service
import os

router = APIRouter()


@router.get("/", response_model=List[DisclosureListResponse])
def list_disclosures(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    List disclosures (filtered by role)

    - INVENTOR: sees only their own disclosures
    - LAWYER: sees assigned disclosures
    - ADMIN: sees all disclosures
    """
    if current_user.role == UserRole.INVENTOR:
        disclosures = db.query(Disclosure).filter(Disclosure.inventor_id == current_user.id).all()
    elif current_user.role == UserRole.LAWYER:
        disclosures = db.query(Disclosure).filter(Disclosure.assigned_lawyer_id == current_user.id).all()
    else:  # ADMIN
        disclosures = db.query(Disclosure).all()

    return disclosures


@router.post("/", response_model=DisclosureResponse, status_code=status.HTTP_201_CREATED)
def create_disclosure(
    disclosure_data: DisclosureCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.INVENTOR, UserRole.ADMIN])),
):
    """
    Create a new disclosure

    Only INVENTOR and ADMIN can create disclosures.
    Optionally assign a lawyer upon creation.
    Triggers AI processing in the background.
    """
    # Verify lawyer exists if assigned
    if disclosure_data.assigned_lawyer_id:
        lawyer = db.query(User).filter(
            User.id == disclosure_data.assigned_lawyer_id,
            User.role == UserRole.LAWYER
        ).first()
        if not lawyer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid lawyer ID or user is not a lawyer"
            )

    # Determine initial status based on lawyer assignment
    initial_status = DisclosureStatus.IN_REVIEW if disclosure_data.assigned_lawyer_id else DisclosureStatus.DRAFT

    new_disclosure = Disclosure(
        title=disclosure_data.title,
        disclosure_type=disclosure_data.disclosure_type,
        content=disclosure_data.content,
        inventor_id=current_user.id,
        assigned_lawyer_id=disclosure_data.assigned_lawyer_id,
        status=initial_status,
        patent_number=disclosure_data.patent_number,
    )

    db.add(new_disclosure)
    db.commit()
    db.refresh(new_disclosure)

    # Create initial version
    initial_version = DisclosureVersion(
        disclosure_id=new_disclosure.id,
        version_number=1,
        content_snapshot=disclosure_data.content,
        edited_by=current_user.id,
    )
    db.add(initial_version)
    db.commit()

    # Trigger AI processing if disclosure has content
    if disclosure_data.content:
        from app.tasks.ai_processing import process_disclosure_async
        background_tasks.add_task(process_disclosure_async, new_disclosure.id, db)

    return new_disclosure


@router.get("/{disclosure_id}", response_model=DisclosureResponse)
def get_disclosure(
    disclosure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get disclosure details

    Users can only view disclosures they have access to.
    """
    disclosure = db.query(Disclosure).filter(Disclosure.id == disclosure_id).first()

    if not disclosure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Disclosure not found",
        )

    # Check permissions
    if current_user.role == UserRole.INVENTOR and disclosure.inventor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == UserRole.LAWYER and disclosure.assigned_lawyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return disclosure


@router.patch("/{disclosure_id}", response_model=DisclosureResponse)
def update_disclosure(
    disclosure_id: int,
    update_data: DisclosureUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update disclosure content

    Only the inventor (or admin) can edit disclosure content.
    Creates a new version on update.
    """
    disclosure = db.query(Disclosure).filter(Disclosure.id == disclosure_id).first()

    if not disclosure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disclosure not found")

    # Check permissions
    if current_user.role != UserRole.ADMIN and disclosure.inventor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only inventor can edit disclosure")

    # Update fields
    if update_data.title is not None:
        disclosure.title = update_data.title
    if update_data.content is not None:
        disclosure.content = update_data.content

        # Create new version
        latest_version = db.query(DisclosureVersion).filter(
            DisclosureVersion.disclosure_id == disclosure_id
        ).order_by(DisclosureVersion.version_number.desc()).first()

        new_version_number = (latest_version.version_number + 1) if latest_version else 1

        new_version = DisclosureVersion(
            disclosure_id=disclosure_id,
            version_number=new_version_number,
            content_snapshot=disclosure.content,
            edited_by=current_user.id,
        )
        db.add(new_version)

    db.commit()
    db.refresh(disclosure)

    # Re-trigger AI processing if content changed significantly
    if update_data.content and disclosure.status != DisclosureStatus.APPROVED:
        from app.tasks.ai_processing import process_disclosure_async
        background_tasks.add_task(process_disclosure_async, disclosure.id, db)

    return disclosure


@router.patch("/{disclosure_id}/status", response_model=DisclosureResponse)
def update_disclosure_status(
    disclosure_id: int,
    status_update: DisclosureStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.LAWYER, UserRole.ADMIN])),
):
    """
    Update disclosure status

    Only LAWYER and ADMIN can change disclosure status.
    """
    disclosure = db.query(Disclosure).filter(Disclosure.id == disclosure_id).first()

    if not disclosure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disclosure not found")

    disclosure.status = status_update.status
    db.commit()
    db.refresh(disclosure)

    return disclosure


@router.post("/{disclosure_id}/assign-lawyer", response_model=DisclosureResponse)
def assign_lawyer(
    disclosure_id: int,
    assignment: LawyerAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
):
    """
    Assign a lawyer to a disclosure

    Only ADMIN can assign lawyers.
    """
    disclosure = db.query(Disclosure).filter(Disclosure.id == disclosure_id).first()

    if not disclosure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disclosure not found")

    # Verify lawyer exists and has LAWYER role
    lawyer = db.query(User).filter(User.id == assignment.lawyer_id, User.role == UserRole.LAWYER).first()
    if not lawyer:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid lawyer ID")

    disclosure.assigned_lawyer_id = assignment.lawyer_id
    disclosure.status = DisclosureStatus.IN_REVIEW
    db.commit()
    db.refresh(disclosure)

    return disclosure


@router.get("/{disclosure_id}/versions", response_model=List[DisclosureVersionResponse])
def get_disclosure_versions(
    disclosure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get version history for a disclosure
    """
    disclosure = db.query(Disclosure).filter(Disclosure.id == disclosure_id).first()

    if not disclosure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disclosure not found")

    # Check permissions
    if current_user.role == UserRole.INVENTOR and disclosure.inventor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == UserRole.LAWYER and disclosure.assigned_lawyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    versions = db.query(DisclosureVersion).filter(
        DisclosureVersion.disclosure_id == disclosure_id
    ).order_by(DisclosureVersion.version_number.desc()).all()

    return versions


@router.delete("/{disclosure_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_disclosure(
    disclosure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
):
    """
    Delete a disclosure

    Only ADMIN can delete disclosures.
    """
    disclosure = db.query(Disclosure).filter(Disclosure.id == disclosure_id).first()

    if not disclosure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disclosure not found")

    db.delete(disclosure)
    db.commit()

    return None


@router.post("/{disclosure_id}/set-patent-file", response_model=DisclosureResponse)
def set_patent_file(
    disclosure_id: int,
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Set the main patent PDF file for a PATENT_REVIEW disclosure
    """
    disclosure = db.query(Disclosure).filter(Disclosure.id == disclosure_id).first()

    if not disclosure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disclosure not found")

    # Check permissions
    if current_user.role == UserRole.INVENTOR and disclosure.inventor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Verify file exists and belongs to this disclosure
    file = db.query(File).filter(File.id == file_id, File.disclosure_id == disclosure_id).first()
    if not file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    disclosure.patent_file_id = file_id
    db.commit()
    db.refresh(disclosure)

    return disclosure


@router.post("/{disclosure_id}/analyze-patent", response_model=DisclosureResponse)
def analyze_patent(
    disclosure_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Trigger AI analysis of the patent PDF

    Extracts text from the patent PDF and runs comprehensive AI analysis.
    Only works for PATENT_REVIEW type disclosures.
    """
    disclosure = db.query(Disclosure).filter(Disclosure.id == disclosure_id).first()

    if not disclosure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disclosure not found")

    # Check permissions
    if current_user.role == UserRole.INVENTOR and disclosure.inventor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == UserRole.LAWYER and disclosure.assigned_lawyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Must be a PATENT_REVIEW type
    if disclosure.disclosure_type != DisclosureType.PATENT_REVIEW:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Analysis only available for PATENT_REVIEW type disclosures"
        )

    # Must have a patent file
    if not disclosure.patent_file_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No patent file uploaded. Please upload a patent PDF first."
        )

    # Get the patent file
    patent_file = db.query(File).filter(File.id == disclosure.patent_file_id).first()
    if not patent_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patent file not found")

    # Extract text from PDF
    file_path = os.path.join(os.getcwd(), "uploads", str(disclosure_id), patent_file.s3_key)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patent file not found on server")

    try:
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        patent_text = ""
        for page in doc:
            patent_text += page.get_text()
        doc.close()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract text from PDF: {str(e)}"
        )

    # Run AI analysis
    try:
        analysis_result = ai_service.analyze_patent(patent_text, disclosure.patent_number)
        disclosure.ai_analysis = analysis_result
        db.commit()
        db.refresh(disclosure)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis failed: {str(e)}"
        )

    return disclosure

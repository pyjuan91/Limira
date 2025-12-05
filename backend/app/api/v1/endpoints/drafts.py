from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_active_user, RoleChecker
from app.models.user import User, UserRole
from app.models.disclosure import Disclosure, DisclosureStatus
from app.models.patent_draft import PatentDraft, AIProcessingStatus
from app.schemas import PatentDraftResponse, DraftSectionUpdate, DraftFullTextUpdate, DraftApproval, RevisionRequest

router = APIRouter()


@router.get("/{disclosure_id}", response_model=PatentDraftResponse)
def get_patent_draft(
    disclosure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get AI-generated patent draft for a disclosure
    If draft doesn't exist, create a new empty one
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

    # Get draft
    draft = db.query(PatentDraft).filter(PatentDraft.disclosure_id == disclosure_id).first()

    # If draft doesn't exist, create one
    if not draft:
        draft = PatentDraft(
            disclosure_id=disclosure_id,
            ai_processing_status=AIProcessingStatus.PENDING,
            sections={},
            figure_index={},
        )
        db.add(draft)
        db.commit()
        db.refresh(draft)

    return draft


@router.patch("/{draft_id}/sections", response_model=PatentDraftResponse)
def update_draft_section(
    draft_id: int,
    section_update: DraftSectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.LAWYER, UserRole.ADMIN])),
):
    """
    Update a specific section of the patent draft

    Only LAWYER and ADMIN can edit drafts.
    """
    draft = db.query(PatentDraft).filter(PatentDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")

    # Check if lawyer is assigned to this disclosure
    disclosure = db.query(Disclosure).filter(Disclosure.id == draft.disclosure_id).first()
    if current_user.role == UserRole.LAWYER and disclosure.assigned_lawyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not assigned to this disclosure")

    # Update the section
    if not isinstance(draft.sections, dict):
        draft.sections = {}

    draft.sections[section_update.section_name] = section_update.content

    db.commit()
    db.refresh(draft)

    return draft


@router.patch("/{draft_id}/full-text", response_model=PatentDraftResponse)
def update_draft_full_text(
    draft_id: int,
    text_update: DraftFullTextUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.LAWYER, UserRole.ADMIN])),
):
    """
    Update the full text of the patent draft

    Only LAWYER and ADMIN can edit drafts.
    """
    draft = db.query(PatentDraft).filter(PatentDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")

    # Check if lawyer is assigned to this disclosure
    disclosure = db.query(Disclosure).filter(Disclosure.id == draft.disclosure_id).first()
    if current_user.role == UserRole.LAWYER and disclosure.assigned_lawyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not assigned to this disclosure")

    # Update the full text
    draft.full_text = text_update.full_text

    db.commit()
    db.refresh(draft)

    return draft


@router.post("/{disclosure_id}/approve", response_model=dict)
def approve_draft(
    disclosure_id: int,
    approval: DraftApproval,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.LAWYER, UserRole.ADMIN])),
):
    """
    Lawyer approves the patent draft
    """
    disclosure = db.query(Disclosure).filter(Disclosure.id == disclosure_id).first()
    if not disclosure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disclosure not found")

    if current_user.role == UserRole.LAWYER and disclosure.assigned_lawyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not assigned to this disclosure")

    disclosure.status = DisclosureStatus.APPROVED
    db.commit()

    # TODO: Send notification to inventor

    return {"message": "Patent draft approved", "disclosure_id": disclosure_id}


@router.post("/{disclosure_id}/request-revision", response_model=dict)
def request_revision(
    disclosure_id: int,
    revision_request: RevisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.LAWYER, UserRole.ADMIN])),
):
    """
    Lawyer requests revisions from inventor
    """
    disclosure = db.query(Disclosure).filter(Disclosure.id == disclosure_id).first()
    if not disclosure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disclosure not found")

    if current_user.role == UserRole.LAWYER and disclosure.assigned_lawyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not assigned to this disclosure")

    disclosure.status = DisclosureStatus.REVISION_REQUESTED
    db.commit()

    # TODO: Create comment with revision feedback
    # TODO: Send notification to inventor

    return {"message": "Revision requested", "disclosure_id": disclosure_id, "feedback": revision_request.feedback}

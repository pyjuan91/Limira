from sqlalchemy.orm import Session
from app.models.disclosure import Disclosure, DisclosureStatus
from app.models.patent_draft import PatentDraft, AIProcessingStatus
from app.services.ai_service import ai_service


def process_disclosure_async(disclosure_id: int, db: Session):
    """
    Background task to process disclosure with AI

    This function runs asynchronously to generate a patent draft
    from the disclosure content.

    Args:
        disclosure_id: ID of the disclosure to process
        db: Database session
    """
    # Get disclosure
    disclosure = db.query(Disclosure).filter(Disclosure.id == disclosure_id).first()
    if not disclosure:
        return

    try:
        # Update disclosure status
        disclosure.status = DisclosureStatus.AI_PROCESSING
        db.commit()

        # Check if draft already exists
        draft = db.query(PatentDraft).filter(PatentDraft.disclosure_id == disclosure_id).first()

        if not draft:
            # Create new draft record
            draft = PatentDraft(
                disclosure_id=disclosure_id,
                ai_processing_status=AIProcessingStatus.PROCESSING,
            )
            db.add(draft)
            db.commit()
            db.refresh(draft)
        else:
            # Update existing draft status
            draft.ai_processing_status = AIProcessingStatus.PROCESSING
            db.commit()

        # Generate patent draft using AI
        sections = ai_service.generate_patent_draft(disclosure.content)

        # Update draft with generated content
        draft.sections = sections
        draft.ai_processing_status = AIProcessingStatus.COMPLETED
        draft.ai_model_used = ai_service.model

        # Update disclosure status
        disclosure.status = DisclosureStatus.READY_FOR_REVIEW

        db.commit()

        # TODO: Send notification to inventor and assigned lawyer

    except Exception as e:
        # Handle errors
        if draft:
            draft.ai_processing_status = AIProcessingStatus.FAILED
            draft.processing_error = str(e)

        disclosure.status = DisclosureStatus.DRAFT
        db.commit()

        # TODO: Log error and notify user

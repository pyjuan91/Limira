from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User, UserRole
from app.models.disclosure import Disclosure
from app.models.video_session import VideoSession
from app.services.ai_service import ai_service
from pydantic import BaseModel

router = APIRouter()


# Schemas
class VideoSessionCreate(BaseModel):
    disclosure_id: int


class VideoSessionUpdate(BaseModel):
    transcript_text: Optional[str] = None
    session_metadata: Optional[Dict[str, Any]] = None


class VideoSessionEnd(BaseModel):
    transcript_text: str
    session_metadata: Optional[Dict[str, Any]] = None


class VideoSessionResponse(BaseModel):
    id: int
    disclosure_id: int
    participants: List[int]
    transcript_text: Optional[str]
    ai_summary: Optional[str]
    session_metadata: Optional[Dict[str, Any]]
    started_at: datetime
    ended_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.post("/create", response_model=VideoSessionResponse, status_code=status.HTTP_201_CREATED)
def create_video_session(
    session_data: VideoSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create a new video session for a disclosure
    """
    # Check disclosure exists
    disclosure = db.query(Disclosure).filter(Disclosure.id == session_data.disclosure_id).first()
    if not disclosure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disclosure not found")

    # Check user has access to this disclosure
    if current_user.role == UserRole.INVENTOR and disclosure.inventor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == UserRole.LAWYER and disclosure.assigned_lawyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Create video session
    participants = []
    if disclosure.inventor_id:
        participants.append(disclosure.inventor_id)
    if disclosure.assigned_lawyer_id:
        participants.append(disclosure.assigned_lawyer_id)

    new_session = VideoSession(
        disclosure_id=session_data.disclosure_id,
        participants=participants,
        session_metadata={}
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return new_session


@router.get("/disclosure/{disclosure_id}", response_model=List[VideoSessionResponse])
def get_disclosure_sessions(
    disclosure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get all video sessions for a disclosure
    """
    # Check disclosure exists and user has access
    disclosure = db.query(Disclosure).filter(Disclosure.id == disclosure_id).first()
    if not disclosure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disclosure not found")

    if current_user.role == UserRole.INVENTOR and disclosure.inventor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == UserRole.LAWYER and disclosure.assigned_lawyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    sessions = db.query(VideoSession).filter(
        VideoSession.disclosure_id == disclosure_id
    ).order_by(VideoSession.started_at.desc()).all()

    return sessions


@router.get("/{session_id}", response_model=VideoSessionResponse)
def get_video_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get a specific video session by ID
    """
    session = db.query(VideoSession).filter(VideoSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Check access
    disclosure = db.query(Disclosure).filter(Disclosure.id == session.disclosure_id).first()
    if current_user.role == UserRole.INVENTOR and disclosure.inventor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == UserRole.LAWYER and disclosure.assigned_lawyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return session


@router.patch("/{session_id}", response_model=VideoSessionResponse)
def update_video_session(
    session_id: int,
    update_data: VideoSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update a video session (add transcript or metadata during call)
    """
    session = db.query(VideoSession).filter(VideoSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Check access
    disclosure = db.query(Disclosure).filter(Disclosure.id == session.disclosure_id).first()
    if current_user.role == UserRole.INVENTOR and disclosure.inventor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == UserRole.LAWYER and disclosure.assigned_lawyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Update fields
    if update_data.transcript_text is not None:
        session.transcript_text = update_data.transcript_text
    if update_data.session_metadata is not None:
        session.session_metadata = update_data.session_metadata

    db.commit()
    db.refresh(session)

    return session


@router.post("/{session_id}/end", response_model=VideoSessionResponse)
def end_video_session(
    session_id: int,
    end_data: VideoSessionEnd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    End a video session and generate AI summary
    """
    session = db.query(VideoSession).filter(VideoSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Check access
    disclosure = db.query(Disclosure).filter(Disclosure.id == session.disclosure_id).first()
    if current_user.role == UserRole.INVENTOR and disclosure.inventor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == UserRole.LAWYER and disclosure.assigned_lawyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Update session
    session.transcript_text = end_data.transcript_text
    session.ended_at = datetime.utcnow()

    if end_data.session_metadata:
        session.session_metadata = end_data.session_metadata

    # Generate AI summary if transcript is provided
    if end_data.transcript_text and len(end_data.transcript_text) > 50:
        try:
            summary = ai_service.summarize_video_transcript(end_data.transcript_text)
            session.ai_summary = summary
        except Exception as e:
            # Don't fail if AI summary fails, just log it
            print(f"Failed to generate AI summary: {str(e)}")
            session.ai_summary = f"Error generating summary: {str(e)}"

    db.commit()
    db.refresh(session)

    return session


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete a video session (admin only)
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    session = db.query(VideoSession).filter(VideoSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    db.delete(session)
    db.commit()

    return None

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User, UserRole
from app.models.disclosure import Disclosure
from app.models.message import Message
from app.schemas import MessageCreate, MessageUpdate, MessageResponse

router = APIRouter()


@router.get("/disclosures/{disclosure_id}/messages", response_model=List[MessageResponse])
def get_messages(
    disclosure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get all messages for a disclosure
    """
    # Check disclosure exists and user has access
    disclosure = db.query(Disclosure).filter(Disclosure.id == disclosure_id).first()
    if not disclosure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disclosure not found")

    # Check permissions - only inventor and assigned lawyer can access
    if current_user.role == UserRole.INVENTOR and disclosure.inventor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == UserRole.LAWYER and disclosure.assigned_lawyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Get messages ordered by creation time
    messages = (
        db.query(Message)
        .filter(Message.disclosure_id == disclosure_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    # Enrich with sender info
    result = []
    for message in messages:
        sender = db.query(User).filter(User.id == message.sender_id).first()
        message_data = MessageResponse.model_validate(message)
        message_data.sender_name = sender.full_name if sender else None
        message_data.sender_role = sender.role.value if sender else None
        result.append(message_data)

    return result


@router.post("/disclosures/{disclosure_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def create_message(
    disclosure_id: int,
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Send a message in a disclosure chat
    """
    # Check disclosure exists and user has access
    disclosure = db.query(Disclosure).filter(Disclosure.id == disclosure_id).first()
    if not disclosure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disclosure not found")

    # Check permissions - only inventor and assigned lawyer can send messages
    if current_user.role == UserRole.INVENTOR and disclosure.inventor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == UserRole.LAWYER and disclosure.assigned_lawyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Create message
    new_message = Message(
        disclosure_id=disclosure_id,
        sender_id=current_user.id,
        content=message_data.content,
        is_read=False,
    )

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    # Enrich with sender info
    message_response = MessageResponse.model_validate(new_message)
    message_response.sender_name = current_user.full_name
    message_response.sender_role = current_user.role.value

    return message_response


@router.patch("/messages/{message_id}", response_model=MessageResponse)
def mark_message_read(
    message_id: int,
    update_data: MessageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Mark a message as read
    """
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    # Check disclosure access
    disclosure = db.query(Disclosure).filter(Disclosure.id == message.disclosure_id).first()
    if not disclosure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disclosure not found")

    # Check permissions
    if current_user.role == UserRole.INVENTOR and disclosure.inventor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == UserRole.LAWYER and disclosure.assigned_lawyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Update message
    message.is_read = update_data.is_read
    db.commit()
    db.refresh(message)

    # Enrich with sender info
    sender = db.query(User).filter(User.id == message.sender_id).first()
    message_response = MessageResponse.model_validate(message)
    message_response.sender_name = sender.full_name if sender else None
    message_response.sender_role = sender.role.value if sender else None

    return message_response

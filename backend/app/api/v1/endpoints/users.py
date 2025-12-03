from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User, UserRole
from app.schemas import UserResponse

router = APIRouter()


@router.get("/lawyers", response_model=List[UserResponse])
def list_lawyers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get list of all lawyers

    Available to all authenticated users (so inventors can choose their lawyer).
    """
    lawyers = db.query(User).filter(User.role == UserRole.LAWYER).all()
    return lawyers


@router.get("/me", response_model=UserResponse)
def get_current_user(
    current_user: User = Depends(get_current_active_user),
):
    """
    Get current user information
    """
    return current_user

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
from app.models.user import UserRole


# Request schemas
class UserSignup(BaseModel):
    """User signup request"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: UserRole
    full_name: Optional[str] = None
    company: Optional[str] = None


class UserLogin(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """User profile update"""
    full_name: Optional[str] = None
    company: Optional[str] = None


# Response schemas
class UserResponse(BaseModel):
    """User data response (safe, no password)"""
    id: int
    email: str
    role: UserRole
    full_name: Optional[str] = None
    company: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True  # For SQLAlchemy models


class TokenResponse(BaseModel):
    """Authentication token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

# HTTP Bearer token authentication scheme
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency to get the current authenticated user from JWT token

    Raises:
        HTTPException: 401 if token is invalid or user not found
    """
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check token type
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    # Get user from database
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency to ensure the current user is active

    Can be extended to check user.is_active flag if needed
    """
    return current_user


class RoleChecker:
    """
    Dependency class to check if user has required role(s)

    Usage:
        @app.get("/admin/users", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
        def get_users():
            ...
    """

    def __init__(self, allowed_roles: list):
        # Convert to list of strings for comparison
        self.allowed_roles = [str(role) if hasattr(role, 'value') else role for role in allowed_roles]

    def __call__(self, user: User = Depends(get_current_active_user)):
        # Convert user.role to string for comparison
        user_role_str = str(user.role.value) if hasattr(user.role, 'value') else str(user.role)

        if user_role_str not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {self.allowed_roles}, user has: {user_role_str}",
            )
        return user

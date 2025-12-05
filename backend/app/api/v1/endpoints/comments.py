from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User, UserRole
from app.models.disclosure import Disclosure
from app.models.comment import Comment
from app.schemas import CommentCreate, CommentUpdate, CommentResponse

router = APIRouter()


@router.get("/disclosures/{disclosure_id}/comments", response_model=List[CommentResponse])
def get_comments(
    disclosure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get all comments for a disclosure
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

    # Get comments
    comments = db.query(Comment).filter(Comment.disclosure_id == disclosure_id).order_by(Comment.created_at.asc()).all()

    # Enrich with author info
    result = []
    for comment in comments:
        author = db.query(User).filter(User.id == comment.author_id).first()
        comment_data = CommentResponse.model_validate(comment)
        comment_data.author_name = author.full_name if author else None
        comment_data.author_role = author.role.value if author else None
        result.append(comment_data)

    return result


@router.post("/disclosures/{disclosure_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    disclosure_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Add a comment to a disclosure
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

    # Create comment
    new_comment = Comment(
        disclosure_id=disclosure_id,
        author_id=current_user.id,
        content=comment_data.content,
        parent_comment_id=comment_data.parent_comment_id,
        selected_text=comment_data.selected_text,
        selection_start=comment_data.selection_start,
        selection_end=comment_data.selection_end,
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    # TODO: Send notification to other party (inventor or lawyer)

    # Return with author info
    comment_response = CommentResponse.model_validate(new_comment)
    comment_response.author_name = current_user.full_name
    comment_response.author_role = current_user.role.value

    return comment_response


@router.patch("/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int,
    update_data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update a comment (only by original author)
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    # Only author or admin can edit
    if comment.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only edit your own comments")

    comment.content = update_data.content
    db.commit()
    db.refresh(comment)

    return comment


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete a comment (only by original author or admin)
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    # Only author or admin can delete
    if comment.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only delete your own comments")

    db.delete(comment)
    db.commit()

    return None

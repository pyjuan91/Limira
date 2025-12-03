from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Comment(Base):
    """Comments on disclosures (supports threading)"""
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    disclosure_id = Column(Integer, ForeignKey("disclosures.id"), nullable=False)

    # Author of the comment
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Comment content
    content = Column(Text, nullable=False)

    # Threading support (for replies)
    parent_comment_id = Column(Integer, ForeignKey("comments.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    disclosure = relationship("Disclosure", back_populates="comments")
    author = relationship("User", back_populates="comments")
    parent = relationship("Comment", remote_side=[id], backref="replies")

    def __repr__(self):
        return f"<Comment(id={self.id}, disclosure_id={self.disclosure_id}, author_id={self.author_id})>"

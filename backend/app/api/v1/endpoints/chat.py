from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
import json
import os

from app.services.ai_service import ai_service
from app.core.dependencies import get_current_active_user
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.disclosure import Disclosure
from app.models.patent_draft import PatentDraft
from app.models.file import File

router = APIRouter()


class ChatMessage(BaseModel):
    """Chat message model"""
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    """Request for chat endpoint"""
    messages: List[ChatMessage]
    system_prompt: Optional[str] = None
    disclosure_id: Optional[int] = None  # Optional: include disclosure context


class ChatResponse(BaseModel):
    """Response from chat endpoint"""
    response: str


def extract_pdf_text(file_path: str) -> str:
    """Extract text from PDF file using PyMuPDF (fitz)"""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text[:10000]  # Limit to 10k chars to avoid token limits
    except ImportError:
        return "[PDF text extraction requires PyMuPDF. Install with: pip install pymupdf]"
    except Exception as e:
        return f"[Error extracting PDF: {str(e)}]"


def build_disclosure_context(
    disclosure: Disclosure,
    draft: Optional[PatentDraft],
    files: List[File],
    db: Session
) -> str:
    """Build context string from disclosure, draft, and files"""
    context_parts = []

    # Add disclosure info
    context_parts.append("=== CURRENT DISCLOSURE ===")
    context_parts.append(f"Title: {disclosure.title}")
    context_parts.append(f"Status: {disclosure.status.value}")
    if disclosure.content:
        context_parts.append(f"Content:\n{json.dumps(disclosure.content, indent=2)}")

    # Add draft info
    if draft:
        context_parts.append("\n=== PATENT DRAFT ===")

        # Include full_text if available (this is what the lawyer edits)
        if draft.full_text:
            context_parts.append("\n--- FULL DRAFT TEXT ---")
            # Limit to 15k chars to avoid token limits
            context_parts.append(draft.full_text[:15000])
            if len(draft.full_text) > 15000:
                context_parts.append("... [truncated]")

        # Also include sections if available
        elif draft.sections:
            for section_name, section_content in draft.sections.items():
                context_parts.append(f"\n--- {section_name.upper()} ---")
                if isinstance(section_content, list):
                    context_parts.append("\n".join(section_content))
                else:
                    context_parts.append(str(section_content))

    # Add files info
    if files:
        context_parts.append("\n=== UPLOADED FILES ===")
        for f in files:
            context_parts.append(f"- {f.original_filename} ({f.file_type.value}, {f.file_size} bytes)")

            # Extract PDF content if it's a PDF
            if f.file_extension.lower() == ".pdf":
                file_path = os.path.join(os.getcwd(), "uploads", str(f.disclosure_id), f.s3_key)
                if os.path.exists(file_path):
                    pdf_text = extract_pdf_text(file_path)
                    if pdf_text and not pdf_text.startswith("["):
                        context_parts.append(f"  Content preview: {pdf_text[:2000]}...")

    return "\n".join(context_parts)


@router.post("/assistant", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Chat with the AI patent drafting assistant

    Requires authentication. Sends conversation history and receives AI response.
    Optionally include disclosure_id to give AI access to draft and file context.
    """
    try:
        # Convert Pydantic models to dicts for ai_service
        messages_dict = [{"role": msg.role, "content": msg.content} for msg in request.messages]

        # Build context if disclosure_id is provided
        disclosure_context = ""
        if request.disclosure_id:
            # Get disclosure
            disclosure = db.query(Disclosure).filter(Disclosure.id == request.disclosure_id).first()
            if disclosure:
                # Check permissions
                if current_user.role == UserRole.INVENTOR and disclosure.inventor_id != current_user.id:
                    raise HTTPException(status_code=403, detail="Access denied to this disclosure")
                elif current_user.role == UserRole.LAWYER and disclosure.assigned_lawyer_id != current_user.id:
                    raise HTTPException(status_code=403, detail="Access denied to this disclosure")

                # Get draft
                draft = db.query(PatentDraft).filter(PatentDraft.disclosure_id == request.disclosure_id).first()

                # Get files
                files = db.query(File).filter(File.disclosure_id == request.disclosure_id).all()

                # Build context
                disclosure_context = build_disclosure_context(disclosure, draft, files, db)

        # Build system prompt with context
        base_prompt = """You are an expert patent drafting assistant with access to the current disclosure, draft, and uploaded files.

You help attorneys and inventors with:
- Answering questions about the current patent draft
- Explaining technical details from uploaded documents
- Patent drafting guidance and best practices
- Legal terminology and claim structure
- Prior art research suggestions
- Technical writing improvements

When answering questions:
1. Reference specific parts of the draft or documents when relevant
2. Provide clear, professional, and actionable advice
3. If information is not in the provided context, say so clearly"""

        if disclosure_context:
            system_prompt = f"{base_prompt}\n\n{disclosure_context}"
        else:
            system_prompt = request.system_prompt or base_prompt

        # Get AI response
        response_text = ai_service.chat(messages_dict, system_prompt)

        return ChatResponse(response=response_text)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.services.ai_service import ai_service
from app.core.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter()


class ChatMessage(BaseModel):
    """Chat message model"""
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    """Request for chat endpoint"""
    messages: List[ChatMessage]
    system_prompt: Optional[str] = None


class ChatResponse(BaseModel):
    """Response from chat endpoint"""
    response: str


@router.post("/assistant", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Chat with the AI patent drafting assistant

    Requires authentication. Sends conversation history and receives AI response.
    """
    try:
        # Convert Pydantic models to dicts for ai_service
        messages_dict = [{"role": msg.role, "content": msg.content} for msg in request.messages]

        # Default system prompt for patent drafting assistant
        system_prompt = request.system_prompt or """You are an expert patent drafting assistant.
You help attorneys with:
- Patent drafting guidance and best practices
- Legal terminology and claim structure
- Prior art research suggestions
- Technical writing improvements

Provide clear, professional, and actionable advice."""

        # Get AI response
        response_text = ai_service.chat(messages_dict, system_prompt)

        return ChatResponse(response=response_text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

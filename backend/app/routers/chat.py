"""
FAQ chatbot route.

Public (no auth) so the floating widget works on the landing page for visitors. It's a
thin wrapper over the isolated LLM service: take a short conversation, return a reply.
"""

from fastapi import APIRouter, HTTPException, status

from app.schemas.chat import ChatRequest, ChatResponse, MentorRequest
from app.services.llm_service import LLMError, chat_reply, mentor_reply

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    """Answer a visitor's question about PM Copilot (or general PM topics)."""
    # Pydantic already caps history length + message size (see schemas/chat.py).
    messages = [{"role": m.role, "content": m.content} for m in payload.messages]
    try:
        reply = chat_reply(messages)
    except LLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"The assistant is unavailable right now — {exc}",
        ) from exc
    return ChatResponse(reply=reply)


@router.post("/mentor", response_model=ChatResponse)
def mentor(payload: MentorRequest) -> ChatResponse:
    """PM AI Chat: in-depth, teaching-style answers to product-management questions.

    Public like the FAQ widget, so the learning platform works for visitors too.
    """
    messages = [{"role": m.role, "content": m.content} for m in payload.messages]
    try:
        reply = mentor_reply(messages, payload.topic)
    except LLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"PM AI is unavailable right now — {exc}",
        ) from exc
    return ChatResponse(reply=reply)

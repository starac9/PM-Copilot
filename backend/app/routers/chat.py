"""
Chat routes: the FAQ widget and the PM AI Chat mentor.

Public (no auth) so they work for visitors on the landing page and Learn section. Because
every call spends LLM quota, each is rate-limited per client IP (see core/rate_limit.py).
They're thin wrappers over the isolated LLM service.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.core.rate_limit import limit_chat_by_ip
from app.schemas.chat import ChatRequest, ChatResponse, MentorRequest
from app.services.llm_service import LLMError, chat_reply, mentor_reply, mentor_stream

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"], dependencies=[Depends(limit_chat_by_ip)])


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
    """PM AI Chat (whole answer at once): in-depth, teaching-style answers."""
    messages = [{"role": m.role, "content": m.content} for m in payload.messages]
    try:
        reply = mentor_reply(messages, payload.topic)
    except LLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"PM AI is unavailable right now — {exc}",
        ) from exc
    return ChatResponse(reply=reply)


@router.post("/mentor/stream")
def mentor_streaming(payload: MentorRequest) -> StreamingResponse:
    """PM AI Chat, streamed: Markdown text chunks are sent as soon as the model produces them.

    The first chunk is fetched before responding, so "no model available" still returns a
    clean 502 JSON error. A failure mid-answer can't change the status anymore, so we append
    a visible note instead of silently truncating.
    """
    messages = [{"role": m.role, "content": m.content} for m in payload.messages]
    try:
        chunks = mentor_stream(messages, payload.topic)
    except LLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"PM AI is unavailable right now — {exc}",
        ) from exc

    def body():
        try:
            yield from chunks
        except Exception as exc:  # noqa: BLE001 - the response has already started
            logger.warning("Mentor stream interrupted: %r", exc)
            yield "\n\n_(The answer was cut off — please try again.)_"

    return StreamingResponse(
        body(),
        media_type="text/plain; charset=utf-8",
        # Ask proxies not to buffer, so tokens reach the browser immediately.
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

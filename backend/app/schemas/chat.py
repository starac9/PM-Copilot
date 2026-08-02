"""Schemas for the FAQ chatbot endpoint."""

from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """One turn in the conversation."""

    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    """The recent conversation history the widget sends up (kept short client-side)."""

    messages: list[ChatMessage] = Field(min_length=1, max_length=20)


class ChatResponse(BaseModel):
    """The assistant's reply."""

    reply: str

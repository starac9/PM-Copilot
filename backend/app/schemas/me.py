"""Schemas for the signed-in user's learning state (/me/...)."""

from pydantic import BaseModel, Field

from app.schemas.chat import ChatMessage



class LearnProgressOut(BaseModel):
    """The lesson slugs this user has completed."""

    completed: list[str]


class LearnProgressSync(BaseModel):
    """Lessons completed in this browser (e.g. before signing in), merged into the account."""

    completed: list[str] = Field(default_factory=list, max_length=500)


class MentorChatState(BaseModel):
    """The saved PM AI Chat conversation (also the PUT body that replaces it)."""

    messages: list[ChatMessage] = Field(default_factory=list, max_length=100)
    topic: str = Field(default="", max_length=200)

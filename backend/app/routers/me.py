"""
"Me" routes: the signed-in user's learning-platform state, so it follows them across devices.

  * /me/learn-progress — which Learn lessons they've completed.
  * /me/mentor-chat    — their current PM AI Chat conversation.

Visitors who aren't signed in keep this state in their browser instead (see the frontend).
"""

import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import get_current_user
from app.models.learning import LearnProgress, MentorChat
from app.models.user import User
from app.schemas.me import LearnProgressOut, LearnProgressSync, MentorChatState

router = APIRouter(prefix="/me", tags=["me"])

_SLUG = re.compile(r"^[a-z0-9-]{1,100}$")


def _completed(db: Session, user: User) -> LearnProgressOut:
    rows = (
        db.query(LearnProgress.lesson_slug)
        .filter(LearnProgress.user_id == user.id)
        .order_by(LearnProgress.completed_at)
        .all()
    )
    return LearnProgressOut(completed=[slug for (slug,) in rows])


def _check_slug(slug: str) -> str:
    if not _SLUG.match(slug):
        raise HTTPException(
            status_code=422, detail="Invalid lesson."
        )
    return slug


@router.get("/learn-progress", response_model=LearnProgressOut)
def get_progress(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List the lessons this user has completed."""
    return _completed(db, user)


@router.post("/learn-progress/sync", response_model=LearnProgressOut)
def sync_progress(
    payload: LearnProgressSync,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Merge lessons completed in the browser into the account (union), return the result."""
    have = set(_completed(db, user).completed)
    for slug in dict.fromkeys(payload.completed):
        if _SLUG.match(slug) and slug not in have:
            db.add(LearnProgress(user_id=user.id, lesson_slug=slug))
            have.add(slug)
    db.commit()
    return _completed(db, user)


@router.put("/learn-progress/{slug}", response_model=LearnProgressOut)
def complete_lesson(
    slug: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a lesson complete (idempotent)."""
    _check_slug(slug)
    exists = (
        db.query(LearnProgress)
        .filter(LearnProgress.user_id == user.id, LearnProgress.lesson_slug == slug)
        .first()
    )
    if exists is None:
        db.add(LearnProgress(user_id=user.id, lesson_slug=slug))
        db.commit()
    return _completed(db, user)


@router.delete("/learn-progress/{slug}", response_model=LearnProgressOut)
def uncomplete_lesson(
    slug: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a lesson as not done (idempotent)."""
    _check_slug(slug)
    db.query(LearnProgress).filter(
        LearnProgress.user_id == user.id, LearnProgress.lesson_slug == slug
    ).delete()
    db.commit()
    return _completed(db, user)


@router.get("/mentor-chat", response_model=MentorChatState)
def get_mentor_chat(user: User = Depends(get_current_user)):
    """The saved PM AI Chat conversation (empty if none)."""
    chat = user.mentor_chat
    if chat is None:
        return MentorChatState()
    return MentorChatState(messages=chat.messages, topic=chat.topic)


@router.put("/mentor-chat", response_model=MentorChatState)
def save_mentor_chat(
    payload: MentorChatState,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Replace the saved conversation."""
    messages = [m.model_dump() for m in payload.messages]
    if user.mentor_chat is None:
        db.add(MentorChat(user_id=user.id, messages=messages, topic=payload.topic))
    else:
        user.mentor_chat.messages = messages
        user.mentor_chat.topic = payload.topic
    db.commit()
    return MentorChatState(messages=messages, topic=payload.topic)


@router.delete("/mentor-chat", status_code=status.HTTP_204_NO_CONTENT)
def clear_mentor_chat(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete the saved conversation ("New chat")."""
    if user.mentor_chat is not None:
        db.delete(user.mentor_chat)
        db.commit()

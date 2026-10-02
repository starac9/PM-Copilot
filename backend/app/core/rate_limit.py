"""
Tiny in-memory rate limiting for endpoints that spend AI quota.

WHY in-memory (not Redis / slowapi): the backend runs as a single instance on Render, so a
process-local sliding window is accurate, has zero infrastructure, and resets harmlessly on
redeploy. If the app ever scales to several instances, swap `_SlidingWindow` for a shared
store — the dependencies below wouldn't change.

Two flavors, used as FastAPI dependencies:
  * per client IP — for public endpoints (the chatbots), where there's no user;
  * per user     — for logged-in generation (PRD, stories, artifacts).
"""

from __future__ import annotations

import math
import threading
import time
from collections import defaultdict, deque

from fastapi import Depends, HTTPException, Request, status

from app.core.config import settings
from app.deps import get_current_user
from app.models.user import User

WINDOW_SECONDS = 3600


class _SlidingWindow:
    """Counts hits per key over the last WINDOW_SECONDS. Thread-safe (sync routes run in a pool)."""

    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def hit(self, key: str, limit: int) -> float | None:
        """Record a hit. Returns None if allowed, else seconds until the next slot frees up."""
        now = time.monotonic()
        with self._lock:
            hits = self._hits[key]
            while hits and now - hits[0] >= WINDOW_SECONDS:
                hits.popleft()
            if len(hits) >= limit:
                return WINDOW_SECONDS - (now - hits[0])
            hits.append(now)
            return None

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


limiter = _SlidingWindow()


def client_ip(request: Request) -> str:
    """The caller's IP. Behind Render's proxy the real client is the first X-Forwarded-For hop."""
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _enforce(key: str, limit: int, what: str) -> None:
    retry_after = limiter.hit(key, limit)
    if retry_after is not None:
        minutes = max(1, math.ceil(retry_after / 60))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"You've reached the limit of {limit} {what} per hour. "
            f"Please try again in about {minutes} minute{'s' if minutes != 1 else ''}.",
            headers={"Retry-After": str(math.ceil(retry_after))},
        )


def limit_chat_by_ip(request: Request) -> None:
    """Dependency for the public chatbots: CHAT_RATE_LIMIT_PER_HOUR questions per IP."""
    _enforce(f"chat:{client_ip(request)}", settings.CHAT_RATE_LIMIT_PER_HOUR, "AI questions")


def limit_generation_by_user(user: User = Depends(get_current_user)) -> None:
    """Dependency for AI generation: GENERATION_RATE_LIMIT_PER_HOUR generations per user."""
    _enforce(f"gen:{user.id}", settings.GENERATION_RATE_LIMIT_PER_HOUR, "AI generations")

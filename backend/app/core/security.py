"""
Security helpers: password hashing + JWT token creation/verification.

WHY hashing: we must NEVER store raw passwords. bcrypt turns a password into a
one-way hash with a built-in random salt, so even if the DB leaks, passwords stay safe.

WHY JWT: after login we hand the browser a signed token. On every later request the
browser sends it back and we verify the signature — no need to look up a session in the
DB. The signature is created with our JWT_SECRET, so tokens can't be forged.
"""

# Makes all type annotations lazy strings (PEP 563). This lets us write modern
# "str | None" hints while still running on Python 3.9 locally; on 3.11+ it's harmless.
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password for storage. Returns a string safe to save in the DB."""
    # bcrypt works on bytes; we encode in, decode out to store as text.
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a login attempt against the stored hash. True if they match."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(subject: str) -> str:
    """Create a signed JWT whose 'sub' (subject) is the user's id.

    We put the user id in the token so later requests can identify the user without a
    password. `exp` makes the token expire, limiting damage if it's stolen.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": str(subject), "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> str | None:
    """Verify a JWT and return the user id inside it, or None if invalid/expired."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload.get("sub")
    except JWTError:
        # Bad signature, expired token, or malformed string — treat all as "not logged in".
        return None

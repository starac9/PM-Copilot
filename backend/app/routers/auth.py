"""
Auth routes: register + login.

Both endpoints return the same `Token` response (a JWT + basic user info) so the
frontend can log the user in immediately after registering.
"""

import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.user import GoogleAuthIn, Token, UserCreate, UserOut

# prefix="/auth" means every route here starts with /auth (e.g. /auth/login).
router = APIRouter(prefix="/auth", tags=["auth"])


def _find_user_by_email(db: Session, email: str) -> User | None:
    """Case-insensitive lookup, so "Me@x.com" and "me@x.com" are the same account (and
    accounts created before emails were normalized to lowercase still match)."""
    return db.query(User).filter(func.lower(User.email) == email.lower()).first()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> Token:
    """Create a new account and return a login token.

    Fails with 409 if the email is already taken, so the frontend can show a clear
    "email already registered" message.
    """
    email_taken = HTTPException(
        status_code=status.HTTP_409_CONFLICT, detail="Email already registered."
    )
    if _find_user_by_email(db, payload.email) is not None:
        raise email_taken

    # Store only the hash, never the raw password.
    user = User(email=payload.email.lower(), hashed_password=hash_password(payload.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:  # two concurrent signups with the same email
        db.rollback()
        raise email_taken from exc
    db.refresh(user)  # reload so user.id (assigned by the DB) is populated

    token = create_access_token(subject=user.id)
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/google", response_model=Token)
def google_auth(payload: GoogleAuthIn, db: Session = Depends(get_db)) -> Token:
    """Sign in (or sign up) with a Google account.

    The browser sends the Google ID token (a JWT signed by Google). We verify it against
    our OAuth client id, then find-or-create a user by their verified email and issue our
    own JWT — so the rest of the app treats Google users exactly like email/password users.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google sign-in is not configured on the server.",
        )

    # Verify the token with Google's library (checks signature, audience, issuer, expiry).
    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token

        idinfo = id_token.verify_oauth2_token(
            payload.credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except Exception as exc:  # noqa: BLE001 - any failure means an untrusted token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google credential."
        ) from exc

    email = idinfo.get("email")
    if not email or not idinfo.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Google account email not verified."
        )

    # Find-or-create by email. Google users get an unusable random password hash (they
    # never log in with a password), so the NOT NULL column is satisfied without a real one.
    user = _find_user_by_email(db, email)
    if user is None:
        user = User(email=email.lower(), hashed_password=hash_password(secrets.token_urlsafe(32)))
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(subject=user.id)
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(payload: UserCreate, db: Session = Depends(get_db)) -> Token:
    """Verify email + password and return a login token.

    We return the SAME 401 whether the email is unknown or the password is wrong, so an
    attacker can't tell which emails are registered.
    """
    user = _find_user_by_email(db, payload.email)
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password."
        )

    token = create_access_token(subject=user.id)
    return Token(access_token=token, user=UserOut.model_validate(user))

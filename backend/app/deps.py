"""
Shared FastAPI dependencies.

`get_current_user` is the gate that protects private routes. Any route that adds
`user: User = Depends(get_current_user)` will:
  - read the "Authorization: Bearer <token>" header,
  - verify the JWT,
  - load the matching user from the DB,
  - or reject the request with 401 if anything fails.
So routes never have to re-implement auth logic.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

# HTTPBearer just extracts the "Bearer <token>" string; it doesn't validate it.
# auto_error=True makes it return 403 automatically if the header is missing.
bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the logged-in User from the request's JWT, or raise 401."""
    # A single, generic error so we don't reveal WHY auth failed (safer).
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user_id = decode_access_token(credentials.credentials)
    if user_id is None or not str(user_id).isdigit():
        raise credentials_error

    user = db.get(User, int(user_id))
    if user is None:
        # Token was valid but the user was deleted — treat as not logged in.
        raise credentials_error

    return user

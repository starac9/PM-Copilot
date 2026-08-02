"""
Pydantic schemas for auth.

WHY separate "schemas" from "models": models are DB tables (SQLAlchemy); schemas are the
shapes of data coming IN from and going OUT to the API (Pydantic). Keeping them apart
means we never accidentally leak a field like `hashed_password` to the client.
"""

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    """Body for register + login. EmailStr validates the email format for us."""

    email: EmailStr
    password: str = Field(min_length=6, description="At least 6 characters.")


class GoogleAuthIn(BaseModel):
    """Body for Google Sign-In: the ID-token credential returned by Google in the browser."""

    credential: str = Field(min_length=1, description="Google ID token (JWT) from the client.")


class UserOut(BaseModel):
    """What we send back about a user — note there is NO password field here."""

    id: int
    email: EmailStr

    # Lets Pydantic read attributes off a SQLAlchemy object (user.id) directly.
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """The login/register response: the JWT the frontend stores and resends."""

    access_token: str
    token_type: str = "bearer"
    user: UserOut

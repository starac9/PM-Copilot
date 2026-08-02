"""Pydantic schemas for projects (the product idea a user submits)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProjectCreate(BaseModel):
    """Body for creating a project — this is also the raw 'idea' fed to Gemini later."""

    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, description="Short description of the product idea.")
    target_audience: str = Field(min_length=1, description="Who the product is for.")


class ProjectOut(BaseModel):
    """What we return for a project. `has_prd` lets the UI show whether a PRD exists yet."""

    id: int
    title: str
    description: str
    target_audience: str
    created_at: datetime
    has_prd: bool = False

    model_config = ConfigDict(from_attributes=True)

"""
Pydantic schemas describing the STRUCTURE of a PRD.

This is the single most important schema in Phase 1. It is used in three ways:
  1. As the `response_schema` we hand to Gemini, forcing it to return exactly this shape.
  2. To validate the JSON Gemini returns before we trust/store it.
  3. As the response shape sent to the frontend, so the UI can render known sections.

Because all three uses share ONE definition, the AI output, the database, and the UI can
never drift out of sync.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class Persona(BaseModel):
    """A target user of the product."""

    name: str = Field(description="A short persona name, e.g. 'Busy Solo Founder'.")
    description: str = Field(description="One or two sentences about who they are.")
    pain_points: list[str] = Field(description="2-4 concrete problems they face today.")


class Scope(BaseModel):
    """What the MVP will and will not include — the classic PM scoping exercise."""

    in_scope: list[str] = Field(description="Features that ARE part of the MVP.")
    out_of_scope: list[str] = Field(description="Features explicitly deferred for later.")


class PRDContent(BaseModel):
    """The full body of a PRD. This is the exact JSON schema Gemini must produce."""

    problem_statement: str = Field(description="The core problem the product solves.")
    personas: list[Persona] = Field(description="2-3 target personas.")
    success_metrics: list[str] = Field(description="3-5 measurable KPIs.")
    scope: Scope
    risks_and_assumptions: list[str] = Field(description="Key risks and assumptions.")


# ---- API request/response wrappers (not sent to Gemini) ----

class PRDUpdate(BaseModel):
    """Body for saving user edits. The user can replace the whole PRD content."""

    content: PRDContent


class PRDOut(BaseModel):
    """What the API returns when reading a PRD."""

    id: int
    project_id: int
    content: PRDContent
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

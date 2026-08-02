"""
Pydantic schemas for PM "artifacts" — the generic building block that lets PM Copilot cover
the whole product-management lifecycle beyond the PRD/stories/roadmap trio.

WHY one generic shape: strategy docs, competitor analyses, OKRs, GTM plans, release notes,
stakeholder updates and more are all — structurally — a headline plus a list of titled,
bulleted sections. Modeling them as ONE `ArtifactContent` means:
  * a single `response_schema` steers every generator,
  * one database table stores them all,
  * one frontend renderer displays them,
  * adding a new PM capability is a registry entry (a prompt), not new plumbing.

Like the PRD schema, `ArtifactContent` is used three ways: as the strict schema handed to
the LLM, to validate what comes back, and as the API shape sent to the frontend.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ArtifactSection(BaseModel):
    """One titled section of an artifact, rendered as a heading + bullet list."""

    title: str = Field(description="Short section heading, e.g. 'Strategic pillars'.")
    body: list[str] = Field(description="2-6 concise, concrete bullet points for this section.")


class ArtifactContent(BaseModel):
    """The body of any PM artifact: a one-line summary plus titled sections."""

    summary: str = Field(description="A single sharp sentence summarizing the artifact.")
    sections: list[ArtifactSection] = Field(description="The artifact's titled sections.")


# ---- API request/response wrappers ----------------------------------------------------

class ArtifactUpdate(BaseModel):
    """Body for saving user edits — the user can replace the whole artifact content."""

    content: ArtifactContent


class ArtifactOut(BaseModel):
    """A full artifact as returned by the API."""

    id: int
    project_id: int
    type: str
    title: str
    content: ArtifactContent
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ArtifactSummary(BaseModel):
    """A lightweight artifact listing (no full section bodies) for the workspace grid."""

    type: str
    title: str
    summary: str
    updated_at: datetime


class CatalogEntry(BaseModel):
    """One available artifact type the user can generate."""

    key: str
    label: str
    description: str


class WorkspaceOut(BaseModel):
    """Everything the workspace page needs in one call: the catalog + what's been generated."""

    catalog: list[CatalogEntry]
    generated: list[ArtifactSummary]

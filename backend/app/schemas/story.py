"""
Pydantic schemas for user stories, epics, and RICE inputs.

Like the PRD schema, `StorySet` is used three ways: as the strict `response_schema` we
hand Gemini, to validate what it returns, and as the API shape sent to the frontend.

IMPORTANT — separation of concerns:
  * Gemini only SUGGESTS the four RICE inputs (reach / impact / confidence / effort).
  * The RICE *score*, the sorting, the Jira priority, and sprint assignment are all
    computed deterministically in our own code (services/roadmap_service.py) — never by
    the LLM. So those derived fields are deliberately NOT part of what Gemini returns.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserStory(BaseModel):
    """A single user story with acceptance criteria and RICE inputs.

    RICE convention used here (kept simple and mirrored exactly on the frontend):
      * reach      — how many users this affects per time period (a count).
      * impact     — 0.25 / 0.5 / 1 / 2 / 3 style multiplier (higher = more impact).
      * confidence — a PERCENTAGE 0-100 (how sure we are), applied as confidence / 100.
      * effort     — story points; also the "cost" used for sprint capacity packing.
    Score = (reach * impact * (confidence / 100)) / effort.
    """

    title: str = Field(description="Short story title.")
    description: str = Field(description="As a <user>, I want <goal>, so that <benefit>.")
    acceptance_criteria: list[str] = Field(description="2-4 testable acceptance criteria.")
    reach: float = Field(description="Users affected per period (a count).")
    impact: float = Field(description="Impact multiplier, e.g. 0.25, 0.5, 1, 2, 3.")
    confidence: float = Field(description="Confidence as a percentage, 0-100.")
    effort: float = Field(description="Story points; also used for sprint capacity.")


class Epic(BaseModel):
    """A group of related user stories."""

    name: str = Field(description="Short epic name.")
    stories: list[UserStory] = Field(description="The stories under this epic.")


class StorySet(BaseModel):
    """The full set of epics for a project — the exact JSON schema Gemini must produce."""

    epics: list[Epic] = Field(description="3-6 epics, each with 2-5 stories.")


# ---- API request/response wrappers (not sent to Gemini) ----

class StorySetUpdate(BaseModel):
    """Body for saving user edits (e.g. tweaked RICE values or story text)."""

    content: StorySet


class StorySetOut(BaseModel):
    """What the API returns when reading a story set."""

    id: int
    project_id: int
    content: StorySet
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---- Roadmap (computed, not stored) ----

class RoadmapRequest(BaseModel):
    """Body for building a roadmap: how many story points a sprint can hold."""

    capacity: float = Field(gt=0, description="Team capacity in story points per sprint.")


class RoadmapStory(BaseModel):
    """A story placed on the roadmap, annotated with its computed RICE score + priority."""

    epic: str
    title: str
    effort: float
    rice_score: float
    priority: str  # one of the fixed Jira buckets (see roadmap_service.JIRA_PRIORITIES)


class Sprint(BaseModel):
    """One sprint: a list of stories whose total effort fits the team's capacity."""

    number: int
    stories: list[RoadmapStory]
    total_effort: float


class RoadmapOut(BaseModel):
    """The computed roadmap returned to the frontend (never persisted)."""

    capacity: float
    sprints: list[Sprint]

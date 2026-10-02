"""
Story routes: generate / read / update a project's story set, and build a sprint roadmap.

Nested under a project (/projects/{project_id}/stories...) because stories only exist in
the context of one project's PRD. Ownership is enforced on every route via
`get_owned_project`, exactly like the PRD routes.

Note the split of responsibilities:
  * POST /generate  → the LLM SUGGESTS stories + RICE inputs (llm_service).
  * PUT             → the user's edited RICE inputs / text are saved verbatim.
  * POST /roadmap   → OUR code (roadmap_service) computes scores + sprint packing.
"""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import get_current_user
from app.models.story_set import StorySet
from app.models.user import User
from app.routers.projects import get_owned_project
from app.schemas.story import RoadmapRequest, RoadmapOut, StorySetOut, StorySetUpdate
from app.services.llm_service import LLMError, generate_stories
from app.services.rag_service import retrieve_context
from app.services.roadmap_service import build_roadmap

router = APIRouter(prefix="/projects/{project_id}/stories", tags=["stories"])


@router.post("/generate", response_model=StorySetOut)
def generate_project_stories(
    project_id: int,
    response: Response,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StorySet:
    """Generate (or regenerate) the story set from the project's PRD.

    Requires a PRD to exist first (409 otherwise) since stories are derived from it.
    """
    project = get_owned_project(project_id, user, db)
    if project.prd is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Generate a PRD before generating stories.",
        )

    # Phase 4: ground stories in the user's uploaded documents when any exist.
    context = ""
    if project.documents:
        result = retrieve_context(
            db, project.id, project.prd.content.get("problem_statement", project.title)
        )
        context = result["context"]
        response.headers["X-Context-Documents"] = ",".join(result["documents"])

    try:
        content = generate_stories(prd_content=project.prd.content, context=context)
    except LLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service failed to generate stories — {exc}",
        ) from exc

    # Upsert: overwrite existing stories on regenerate, else create the row.
    if project.story_set is not None:
        project.story_set.content = content
        story_set = project.story_set
    else:
        story_set = StorySet(project_id=project.id, content=content)
        db.add(story_set)

    db.commit()
    db.refresh(story_set)
    return story_set


@router.get("", response_model=StorySetOut)
def get_project_stories(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StorySet:
    """Return the project's story set, or 404 if none has been generated yet."""
    project = get_owned_project(project_id, user, db)
    if project.story_set is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No stories generated yet."
        )
    return project.story_set


@router.put("", response_model=StorySetOut)
def update_project_stories(
    project_id: int,
    payload: StorySetUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StorySet:
    """Save user edits (tweaked RICE inputs, story text, acceptance criteria).

    Because `payload.content` is a `StorySet`, an edit that breaks the schema is rejected
    before it reaches the database.
    """
    project = get_owned_project(project_id, user, db)
    if project.story_set is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No stories to update. Generate first."
        )

    project.story_set.content = payload.content.model_dump()
    db.commit()
    db.refresh(project.story_set)
    return project.story_set


@router.post("/roadmap", response_model=RoadmapOut)
def build_project_roadmap(
    project_id: int,
    payload: RoadmapRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Compute a sprint roadmap from the saved stories and a team capacity.

    This is pure, deterministic logic (no LLM): stories are ranked by RICE score and
    greedily packed into sprints that respect the capacity. The result is NOT persisted —
    it's derived on demand so it always reflects the latest edited RICE values.
    """
    project = get_owned_project(project_id, user, db)
    if project.story_set is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No stories to plan. Generate first."
        )
    return build_roadmap(project.story_set.content, payload.capacity)

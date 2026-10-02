"""
PRD routes: generate / read / update a project's PRD.

These are nested under a project (/projects/{project_id}/prd...) because a PRD only ever
exists in the context of one project. Every route re-checks ownership via
`get_owned_project`, so a user can never touch another user's PRD.
"""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import get_current_user
from app.models.prd import PRD
from app.models.user import User
from app.routers.projects import get_owned_project
from app.schemas.prd import PRDOut, PRDUpdate
from app.services.llm_service import LLMError, generate_prd
from app.services.rag_service import retrieve_context

router = APIRouter(prefix="/projects/{project_id}/prd", tags=["prd"])


@router.post("/generate", response_model=PRDOut)
def generate_project_prd(
    project_id: int,
    response: Response,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PRD:
    """Generate (or regenerate) the PRD for a project using Gemini.

    Flow: verify ownership -> retrieve RAG context (if docs uploaded) -> call the Gemini
    service -> upsert the JSONB PRD row. If Gemini fails after its retry, we return 502
    (Bad Gateway) — the failure is an upstream service, not the client's fault.
    """
    project = get_owned_project(project_id, user, db)

    # Phase 4: ground the PRD in the user's own documents when any exist. Retrieval never
    # raises (it degrades to empty context), so it can't block generation.
    context = ""
    if project.documents:
        result = retrieve_context(
            db, project.id, f"{project.title}. {project.description}"
        )
        context = result["context"]
        # Tell the frontend which documents grounded this generation.
        response.headers["X-Context-Documents"] = ",".join(result["documents"])

    try:
        content = generate_prd(
            title=project.title,
            description=project.description,
            target_audience=project.target_audience,
            context=context,
        )
    except LLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service failed to generate the PRD — {exc}",
        ) from exc

    # Upsert: if a PRD already exists, overwrite its content (regenerate); else create one.
    if project.prd is not None:
        project.prd.content = content
        prd = project.prd
    else:
        prd = PRD(project_id=project.id, content=content)
        db.add(prd)

    db.commit()
    db.refresh(prd)
    return prd


@router.get("", response_model=PRDOut)
def get_project_prd(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PRD:
    """Return the project's PRD, or 404 if it hasn't been generated yet."""
    project = get_owned_project(project_id, user, db)
    if project.prd is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No PRD generated for this project yet."
        )
    return project.prd


@router.put("", response_model=PRDOut)
def update_project_prd(
    project_id: int,
    payload: PRDUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PRD:
    """Save user edits to the PRD.

    The frontend lets the user edit any section inline; on save it sends the full,
    validated PRD content back here. Because `payload.content` is a `PRDContent`, an edit
    that breaks the schema is rejected before it ever reaches the database.
    """
    project = get_owned_project(project_id, user, db)
    if project.prd is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No PRD to update. Generate one first."
        )

    # model_dump() converts the validated Pydantic object back to a plain dict for JSONB.
    project.prd.content = payload.content.model_dump()
    db.commit()
    db.refresh(project.prd)
    return project.prd

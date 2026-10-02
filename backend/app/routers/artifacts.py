"""
Artifact routes: the end-to-end PM workspace.

Nested under a project, these power every PM artifact beyond the PRD/stories/roadmap spine
— strategy, market analysis, OKRs, personas, GTM, release notes, stakeholder updates, and
discovery — through ONE generic set of endpoints. Each artifact type is defined by a registry
entry (services/prompts.ARTIFACT_SPECS); the endpoints here stay identical for every type.

Ownership is enforced via `get_owned_project`, like every other nested resource.
"""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rate_limit import limit_generation_by_user
from app.deps import get_current_user
from app.models.artifact import Artifact
from app.models.user import User
from app.routers.projects import get_owned_project
from app.schemas.artifact import (
    ArtifactOut,
    ArtifactSummary,
    ArtifactUpdate,
    CatalogEntry,
    WorkspaceOut,
)
from app.services.llm_service import LLMError, generate_artifact
from app.services.prompts import ARTIFACT_SPECS, artifact_catalog
from app.services.rag_service import retrieve_context

router = APIRouter(prefix="/projects/{project_id}/artifacts", tags=["artifacts"])


def _known_type_or_404(artifact_type: str) -> dict:
    """Return the registry spec for a type, or 404 if the type doesn't exist."""
    spec = ARTIFACT_SPECS.get(artifact_type)
    if spec is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown artifact type: {artifact_type}."
        )
    return spec


@router.get("", response_model=WorkspaceOut)
def get_workspace(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WorkspaceOut:
    """Return the artifact catalog plus lightweight summaries of what's already generated.

    One call gives the workspace page everything it needs to render every available type and
    show which ones exist.
    """
    project = get_owned_project(project_id, user, db)
    generated = [
        ArtifactSummary(
            type=a.type,
            title=a.title,
            summary=a.content.get("summary", ""),
            updated_at=a.updated_at,
        )
        for a in project.artifacts
    ]
    catalog = [CatalogEntry(**entry) for entry in artifact_catalog()]
    return WorkspaceOut(catalog=catalog, generated=generated)


@router.post(
    "/{artifact_type}/generate",
    response_model=ArtifactOut,
    dependencies=[Depends(limit_generation_by_user)],  # AI calls spend quota
)
def generate_project_artifact(
    project_id: int,
    artifact_type: str,
    response: Response,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Artifact:
    """Generate (or regenerate) an artifact of `artifact_type` for a project.

    Flow: verify ownership + type -> ground in the PRD (if any) and uploaded docs (RAG) ->
    call the LLM -> upsert the JSONB artifact row. An LLM failure returns 502.
    """
    spec = _known_type_or_404(artifact_type)
    project = get_owned_project(project_id, user, db)

    # Ground the artifact in the project's own PRD and documents when available.
    prd_content = project.prd.content if project.prd is not None else None

    context = ""
    if project.documents:
        result = retrieve_context(db, project.id, f"{spec['label']}: {project.title}")
        context = result["context"]
        response.headers["X-Context-Documents"] = ",".join(result["documents"])

    try:
        content = generate_artifact(
            artifact_type=artifact_type,
            title=project.title,
            description=project.description,
            target_audience=project.target_audience,
            prd_content=prd_content,
            context=context,
        )
    except LLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service failed to generate the {spec['label']} — {exc}",
        ) from exc

    # Upsert: overwrite the existing artifact of this type, or create a new one.
    artifact = next((a for a in project.artifacts if a.type == artifact_type), None)
    if artifact is not None:
        artifact.content = content
        artifact.title = spec["label"]
    else:
        artifact = Artifact(
            project_id=project.id, type=artifact_type, title=spec["label"], content=content
        )
        db.add(artifact)

    db.commit()
    db.refresh(artifact)
    return artifact


def _get_owned_artifact(project_id, artifact_type, user, db) -> Artifact:
    """Load one artifact by type for a project the user owns, or raise 404."""
    _known_type_or_404(artifact_type)
    project = get_owned_project(project_id, user, db)
    artifact = next((a for a in project.artifacts if a.type == artifact_type), None)
    if artifact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This artifact hasn't been generated yet.",
        )
    return artifact


@router.get("/{artifact_type}", response_model=ArtifactOut)
def get_project_artifact(
    project_id: int,
    artifact_type: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Artifact:
    """Return a single artifact by type, or 404 if it hasn't been generated."""
    return _get_owned_artifact(project_id, artifact_type, user, db)


@router.put("/{artifact_type}", response_model=ArtifactOut)
def update_project_artifact(
    project_id: int,
    artifact_type: str,
    payload: ArtifactUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Artifact:
    """Save user edits to an artifact. The body replaces the whole validated content."""
    artifact = _get_owned_artifact(project_id, artifact_type, user, db)
    artifact.content = payload.content.model_dump()
    db.commit()
    db.refresh(artifact)
    return artifact


@router.delete("/{artifact_type}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_artifact(
    project_id: int,
    artifact_type: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete an artifact by type (404 if it doesn't exist)."""
    artifact = _get_owned_artifact(project_id, artifact_type, user, db)
    db.delete(artifact)
    db.commit()

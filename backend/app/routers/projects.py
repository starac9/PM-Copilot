"""
Project routes: create / list / delete.

Every route requires a logged-in user (via Depends(get_current_user)) and only ever
touches projects owned by THAT user. This "owner scoping" is what stops user A from
reading or deleting user B's projects.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.deps import get_current_user
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectOut

router = APIRouter(prefix="/projects", tags=["projects"])


def get_owned_project(project_id: int, user: User, db: Session) -> Project:
    """Load a project by id but ONLY if it belongs to `user`; else raise 404.

    We return 404 (not 403) for someone else's project so we don't even reveal that the
    project exists. This helper is reused by the projects and prd routers.
    """
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == user.id)
        .first()
    )
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return project


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProjectOut:
    """Create a project owned by the current user. The PRD is generated separately later."""
    project = Project(
        owner_id=user.id,
        title=payload.title,
        description=payload.description,
        target_audience=payload.target_audience,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return _to_out(project)


@router.get("", response_model=list[ProjectOut])
def list_projects(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ProjectOut]:
    """List the current user's projects, newest first."""
    projects = (
        db.query(Project)
        # Eager-load each project's PRD in one extra query so computing `has_prd` below
        # doesn't fire a separate SELECT per project (avoids the classic N+1).
        .options(selectinload(Project.prd))
        .filter(Project.owner_id == user.id)
        .order_by(Project.created_at.desc())
        .all()
    )
    return [_to_out(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProjectOut:
    """Return a single project the user owns (404 otherwise).

    The project detail page uses this to show the idea's title/description before the
    PRD is generated. Ownership is enforced by the shared `get_owned_project` helper.
    """
    return _to_out(get_owned_project(project_id, user, db))


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a project (and its PRD, via cascade). 404 if it isn't the user's."""
    project = get_owned_project(project_id, user, db)
    db.delete(project)
    db.commit()
    # 204 = success with no body.


def _to_out(project: Project) -> ProjectOut:
    """Convert a Project ORM row to the API shape, computing has_prd for the UI."""
    data = ProjectOut.model_validate(project)
    data.has_prd = project.prd is not None
    return data

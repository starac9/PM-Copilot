"""
Export routes: download a project's PRD + stories as Markdown or Jira CSV.

Both routes return a file download (Content-Disposition: attachment) rather than JSON, so
clicking a link in the browser saves a file. Ownership is enforced via `get_owned_project`.
"""

import re

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.routers.projects import get_owned_project
from app.services.export_service import build_jira_csv, build_markdown

router = APIRouter(prefix="/projects/{project_id}/export", tags=["export"])


def _slug(title: str) -> str:
    """Turn a project title into a safe filename stem (letters/numbers/dashes)."""
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return slug or "project"


@router.get("/markdown")
def export_markdown(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    """Return the PRD + stories as a downloadable Markdown (.md) file."""
    project = get_owned_project(project_id, user, db)
    prd = project.prd.content if project.prd else None
    stories = project.story_set.content if project.story_set else None
    if prd is None and stories is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Nothing to export yet."
        )

    markdown = build_markdown(project.title, prd, stories)
    filename = f"{_slug(project.title)}.md"
    return Response(
        content=markdown,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/jira.csv")
def export_jira_csv(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    """Return the stories as a Jira-importable CSV file."""
    project = get_owned_project(project_id, user, db)
    if project.story_set is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Generate stories before exporting to Jira."
        )

    csv_text = build_jira_csv(project.story_set.content)
    filename = f"{_slug(project.title)}-jira.csv"
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

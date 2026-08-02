"""
Tests for the export helpers (pure functions) and the export routes.

The pure-function tests assert the important guarantees: Markdown includes the real
content, and the Jira CSV has EXACTLY the required columns and valid priority values.
"""

import csv
import io

from app.services.export_service import JIRA_COLUMNS, build_jira_csv, build_markdown
from app.services.roadmap_service import JIRA_PRIORITIES
from tests.conftest import FAKE_PRD
from tests.test_stories import FAKE_STORIES


def test_build_markdown_includes_prd_and_stories():
    md = build_markdown("PM Copilot", FAKE_PRD, FAKE_STORIES)
    assert "# PM Copilot" in md
    assert FAKE_PRD["problem_statement"] in md
    assert "Generate PRD" in md          # a story title
    assert "Acceptance criteria" in md


def test_build_markdown_handles_missing_sections():
    """Export still works if only the PRD (or only stories) exists."""
    md = build_markdown("Idea", FAKE_PRD, None)
    assert "User stories" not in md
    assert "Product Requirements Document" in md


def test_jira_csv_has_exact_columns_and_valid_priorities():
    csv_text = build_jira_csv(FAKE_STORIES)
    reader = csv.DictReader(io.StringIO(csv_text))

    # Columns must match Jira's expected header exactly, in order.
    assert reader.fieldnames == JIRA_COLUMNS

    rows = list(reader)
    story_rows = [r for r in rows if r["Issue Type"] == "Story"]
    epic_rows = [r for r in rows if r["Issue Type"] == "Epic"]
    assert epic_rows and story_rows

    # Every story priority is one of the exact five allowed values, and links to its epic.
    for row in story_rows:
        assert row["Priority"] in JIRA_PRIORITIES
        assert row["Epic Link"] == "Core PRD"


def _setup_project_with_stories(client, auth_headers, monkeypatch):
    monkeypatch.setattr("app.routers.prd.generate_prd", lambda **kwargs: FAKE_PRD)
    monkeypatch.setattr("app.routers.stories.generate_stories", lambda **kwargs: FAKE_STORIES)
    pid = client.post(
        "/projects",
        headers=auth_headers,
        json={"title": "PM Copilot", "description": "AI PRDs.", "target_audience": "PMs."},
    ).json()["id"]
    client.post(f"/projects/{pid}/prd/generate", headers=auth_headers)
    client.post(f"/projects/{pid}/stories/generate", headers=auth_headers)
    return pid


def test_export_markdown_route(client, auth_headers, monkeypatch):
    pid = _setup_project_with_stories(client, auth_headers, monkeypatch)
    resp = client.get(f"/projects/{pid}/export/markdown", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/markdown")
    assert "attachment" in resp.headers["content-disposition"]


def test_export_jira_csv_route(client, auth_headers, monkeypatch):
    pid = _setup_project_with_stories(client, auth_headers, monkeypatch)
    resp = client.get(f"/projects/{pid}/export/jira.csv", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    assert "Summary,Issue Type,Description,Priority,Epic Link" in resp.text

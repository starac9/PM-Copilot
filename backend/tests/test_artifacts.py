"""
Tests for the end-to-end PM artifact workspace.

The LLM call is always mocked (monkeypatch on `app.routers.artifacts.generate_artifact`, the
name the router actually calls) so tests are fast, free, and deterministic. They verify OUR
logic: the catalog, generate/upsert, ownership scoping, edits, delete, and error handling.
"""

from app.services.llm_service import LLMError
from tests.conftest import FAKE_ARTIFACT


def _create_project(client, auth_headers) -> int:
    resp = client.post(
        "/projects",
        headers=auth_headers,
        json={
            "title": "PM Copilot",
            "description": "AI that writes PRDs.",
            "target_audience": "Solo founders and PMs.",
        },
    )
    assert resp.status_code == 201
    return resp.json()["id"]


def test_workspace_lists_catalog_and_empty_generated(client, auth_headers):
    """A fresh project exposes the full catalog and no generated artifacts yet."""
    project_id = _create_project(client, auth_headers)
    resp = client.get(f"/projects/{project_id}/artifacts", headers=auth_headers)

    assert resp.status_code == 200
    body = resp.json()
    keys = {entry["key"] for entry in body["catalog"]}
    # A few representative types from the registry should be present.
    assert {"strategy", "gtm", "okrs"} <= keys
    assert body["generated"] == []


def test_generate_artifact_success(client, auth_headers, monkeypatch):
    """Generating an artifact stores it and returns the uniform content shape."""
    monkeypatch.setattr("app.routers.artifacts.generate_artifact", lambda **kwargs: FAKE_ARTIFACT)

    project_id = _create_project(client, auth_headers)
    resp = client.post(f"/projects/{project_id}/artifacts/strategy/generate", headers=auth_headers)

    assert resp.status_code == 200
    body = resp.json()
    assert body["type"] == "strategy"
    assert body["title"] == "Product Strategy"
    assert body["content"]["summary"] == FAKE_ARTIFACT["summary"]
    assert len(body["content"]["sections"]) == 2

    # It now shows up in the workspace's generated list.
    ws = client.get(f"/projects/{project_id}/artifacts", headers=auth_headers).json()
    assert [g["type"] for g in ws["generated"]] == ["strategy"]


def test_generate_unknown_type_returns_404(client, auth_headers):
    """An unknown artifact type is rejected before any generation happens."""
    project_id = _create_project(client, auth_headers)
    resp = client.post(f"/projects/{project_id}/artifacts/nope/generate", headers=auth_headers)
    assert resp.status_code == 404


def test_regenerate_overwrites_same_type(client, auth_headers, monkeypatch):
    """Regenerating a type upserts (one row per type), it doesn't duplicate."""
    monkeypatch.setattr("app.routers.artifacts.generate_artifact", lambda **kwargs: FAKE_ARTIFACT)
    project_id = _create_project(client, auth_headers)

    client.post(f"/projects/{project_id}/artifacts/strategy/generate", headers=auth_headers)
    client.post(f"/projects/{project_id}/artifacts/strategy/generate", headers=auth_headers)

    ws = client.get(f"/projects/{project_id}/artifacts", headers=auth_headers).json()
    assert len(ws["generated"]) == 1


def test_generate_llm_failure_returns_502(client, auth_headers, monkeypatch):
    """An LLM failure surfaces as a clean 502, not a crash."""

    def _boom(**kwargs):
        raise LLMError("simulated failure")

    monkeypatch.setattr("app.routers.artifacts.generate_artifact", _boom)
    project_id = _create_project(client, auth_headers)
    resp = client.post(f"/projects/{project_id}/artifacts/gtm/generate", headers=auth_headers)

    assert resp.status_code == 502
    assert "AI service" in resp.json()["detail"]


def test_get_artifact_before_generation_returns_404(client, auth_headers):
    project_id = _create_project(client, auth_headers)
    resp = client.get(f"/projects/{project_id}/artifacts/strategy", headers=auth_headers)
    assert resp.status_code == 404


def test_update_artifact_persists_edits(client, auth_headers, monkeypatch):
    """Editing an artifact and saving via PUT persists the change."""
    monkeypatch.setattr("app.routers.artifacts.generate_artifact", lambda **kwargs: FAKE_ARTIFACT)
    project_id = _create_project(client, auth_headers)
    client.post(f"/projects/{project_id}/artifacts/strategy/generate", headers=auth_headers)

    edited = {**FAKE_ARTIFACT, "summary": "Edited summary."}
    resp = client.put(
        f"/projects/{project_id}/artifacts/strategy",
        headers=auth_headers,
        json={"content": edited},
    )
    assert resp.status_code == 200
    assert resp.json()["content"]["summary"] == "Edited summary."


def test_delete_artifact(client, auth_headers, monkeypatch):
    monkeypatch.setattr("app.routers.artifacts.generate_artifact", lambda **kwargs: FAKE_ARTIFACT)
    project_id = _create_project(client, auth_headers)
    client.post(f"/projects/{project_id}/artifacts/strategy/generate", headers=auth_headers)

    resp = client.delete(f"/projects/{project_id}/artifacts/strategy", headers=auth_headers)
    assert resp.status_code == 204

    ws = client.get(f"/projects/{project_id}/artifacts", headers=auth_headers).json()
    assert ws["generated"] == []


def test_cannot_touch_another_users_artifacts(client, auth_headers, monkeypatch):
    """User B can't generate or read artifacts on User A's project (looks like 404)."""
    monkeypatch.setattr("app.routers.artifacts.generate_artifact", lambda **kwargs: FAKE_ARTIFACT)
    project_id = _create_project(client, auth_headers)

    other = client.post(
        "/auth/register", json={"email": "intruder@example.com", "password": "secret123"}
    )
    other_headers = {"Authorization": f"Bearer {other.json()['access_token']}"}

    resp = client.post(
        f"/projects/{project_id}/artifacts/strategy/generate", headers=other_headers
    )
    assert resp.status_code == 404

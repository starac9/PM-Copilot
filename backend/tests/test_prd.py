"""
Tests for the PRD generation endpoint.

The real Gemini call is ALWAYS mocked (via monkeypatch) so tests are fast, free, and
deterministic — they verify OUR logic (auth, ownership, storage, error handling), not
Google's service.

We patch `app.routers.prd.generate_prd` (not the service module) because the router
imported the function by name, so that's the reference actually called at runtime.
"""

from app.services.llm_service import LLMError
from tests.conftest import FAKE_PRD


def _create_project(client, auth_headers) -> int:
    """Helper: create a project and return its id."""
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


def test_generate_prd_success(client, auth_headers, monkeypatch):
    """A logged-in owner can generate a PRD; it is returned and matches the schema."""
    monkeypatch.setattr("app.routers.prd.generate_prd", lambda **kwargs: FAKE_PRD)

    project_id = _create_project(client, auth_headers)
    resp = client.post(f"/projects/{project_id}/prd/generate", headers=auth_headers)

    assert resp.status_code == 200
    body = resp.json()
    assert body["project_id"] == project_id
    assert body["content"]["problem_statement"] == FAKE_PRD["problem_statement"]
    assert len(body["content"]["success_metrics"]) == 3


def test_generate_prd_requires_auth(client):
    """Without a token, generation is rejected (can't even reach a project)."""
    resp = client.post("/projects/1/prd/generate")
    # HTTPBearer returns 403 when the Authorization header is missing entirely.
    assert resp.status_code in (401, 403)


def test_generate_prd_gemini_failure_returns_502(client, auth_headers, monkeypatch):
    """If the AI service fails after retry, the client gets a clean 502, not a crash."""

    def _boom(**kwargs):
        raise LLMError("simulated rate limit")

    monkeypatch.setattr("app.routers.prd.generate_prd", _boom)

    project_id = _create_project(client, auth_headers)
    resp = client.post(f"/projects/{project_id}/prd/generate", headers=auth_headers)

    assert resp.status_code == 502
    assert "AI service" in resp.json()["detail"]


def test_get_prd_before_generation_returns_404(client, auth_headers):
    """Reading a PRD that was never generated returns 404 with a helpful message."""
    project_id = _create_project(client, auth_headers)
    resp = client.get(f"/projects/{project_id}/prd", headers=auth_headers)
    assert resp.status_code == 404


def test_cannot_generate_prd_for_another_users_project(client, auth_headers, monkeypatch):
    """User B cannot generate a PRD on User A's project — it looks like 404 (not found)."""
    monkeypatch.setattr("app.routers.prd.generate_prd", lambda **kwargs: FAKE_PRD)

    # User A owns the project.
    project_id = _create_project(client, auth_headers)

    # User B registers and tries to touch A's project.
    other = client.post(
        "/auth/register", json={"email": "intruder@example.com", "password": "secret123"}
    )
    other_headers = {"Authorization": f"Bearer {other.json()['access_token']}"}

    resp = client.post(f"/projects/{project_id}/prd/generate", headers=other_headers)
    assert resp.status_code == 404


def test_update_prd_persists_edits(client, auth_headers, monkeypatch):
    """Editing a section and saving via PUT persists the change."""
    monkeypatch.setattr("app.routers.prd.generate_prd", lambda **kwargs: FAKE_PRD)
    project_id = _create_project(client, auth_headers)
    client.post(f"/projects/{project_id}/prd/generate", headers=auth_headers)

    edited = {**FAKE_PRD, "problem_statement": "Edited problem statement."}
    resp = client.put(
        f"/projects/{project_id}/prd", headers=auth_headers, json={"content": edited}
    )

    assert resp.status_code == 200
    assert resp.json()["content"]["problem_statement"] == "Edited problem statement."

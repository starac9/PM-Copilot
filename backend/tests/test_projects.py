"""
Tests for project CRUD, focused on ownership scoping (the security-critical part).

Like the PRD tests, these use the SQLite test DB and never touch a real database or the
network. No Gemini mocking is needed here — projects don't call the AI.
"""


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


def test_get_project_returns_owned_project(client, auth_headers):
    """The owner can fetch their own project, and has_prd is False before generation."""
    project_id = _create_project(client, auth_headers)
    resp = client.get(f"/projects/{project_id}", headers=auth_headers)

    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == project_id
    assert body["title"] == "PM Copilot"
    assert body["has_prd"] is False


def test_get_project_hides_other_users_project(client, auth_headers):
    """User B fetching User A's project gets 404 — we never reveal it exists."""
    project_id = _create_project(client, auth_headers)

    other = client.post(
        "/auth/register", json={"email": "intruder@example.com", "password": "secret123"}
    )
    other_headers = {"Authorization": f"Bearer {other.json()['access_token']}"}

    resp = client.get(f"/projects/{project_id}", headers=other_headers)
    assert resp.status_code == 404


def test_get_missing_project_returns_404(client, auth_headers):
    """Fetching a project id that doesn't exist returns 404."""
    resp = client.get("/projects/99999", headers=auth_headers)
    assert resp.status_code == 404

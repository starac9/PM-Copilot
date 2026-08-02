"""
Tests for the story endpoints. The Gemini call is mocked (like the PRD tests) so these
verify OUR logic: PRD-required guard, storage, ownership, editing, and roadmap building.

We patch `app.routers.stories.generate_stories` — the name the router actually calls.
"""

from tests.conftest import FAKE_PRD

# A schema-valid StorySet used to fake Gemini's story output.
FAKE_STORIES = {
    "epics": [
        {
            "name": "Core PRD",
            "stories": [
                {
                    "title": "Generate PRD",
                    "description": "As a founder, I want a PRD, so that I can plan.",
                    "acceptance_criteria": ["Returns 5 sections", "Stored as JSON"],
                    "reach": 500,
                    "impact": 3,
                    "confidence": 80,
                    "effort": 3,
                },
                {
                    "title": "Edit a section",
                    "description": "As a PM, I want to edit, so that I can refine.",
                    "acceptance_criteria": ["Save persists"],
                    "reach": 200,
                    "impact": 1,
                    "confidence": 60,
                    "effort": 2,
                },
            ],
        }
    ]
}


def _create_project(client, auth_headers) -> int:
    resp = client.post(
        "/projects",
        headers=auth_headers,
        json={"title": "PM Copilot", "description": "AI PRDs.", "target_audience": "PMs."},
    )
    return resp.json()["id"]


def _generate_prd(client, auth_headers, project_id, monkeypatch):
    monkeypatch.setattr("app.routers.prd.generate_prd", lambda **kwargs: FAKE_PRD)
    client.post(f"/projects/{project_id}/prd/generate", headers=auth_headers)


def test_generate_stories_requires_prd(client, auth_headers, monkeypatch):
    """Generating stories before a PRD exists returns 409."""
    monkeypatch.setattr("app.routers.stories.generate_stories", lambda **kwargs: FAKE_STORIES)
    project_id = _create_project(client, auth_headers)

    resp = client.post(f"/projects/{project_id}/stories/generate", headers=auth_headers)
    assert resp.status_code == 409


def test_generate_and_get_stories(client, auth_headers, monkeypatch):
    """With a PRD present, stories generate, persist, and can be read back."""
    monkeypatch.setattr("app.routers.stories.generate_stories", lambda **kwargs: FAKE_STORIES)
    project_id = _create_project(client, auth_headers)
    _generate_prd(client, auth_headers, project_id, monkeypatch)

    gen = client.post(f"/projects/{project_id}/stories/generate", headers=auth_headers)
    assert gen.status_code == 200
    assert gen.json()["content"]["epics"][0]["name"] == "Core PRD"

    got = client.get(f"/projects/{project_id}/stories", headers=auth_headers)
    assert got.status_code == 200
    assert len(got.json()["content"]["epics"][0]["stories"]) == 2


def test_update_stories_persists_edits(client, auth_headers, monkeypatch):
    """Edited RICE values are saved verbatim (the LLM doesn't override the user)."""
    monkeypatch.setattr("app.routers.stories.generate_stories", lambda **kwargs: FAKE_STORIES)
    project_id = _create_project(client, auth_headers)
    _generate_prd(client, auth_headers, project_id, monkeypatch)
    client.post(f"/projects/{project_id}/stories/generate", headers=auth_headers)

    edited = {"epics": [{**FAKE_STORIES["epics"][0]}]}
    edited["epics"][0]["stories"][0]["effort"] = 13
    resp = client.put(
        f"/projects/{project_id}/stories", headers=auth_headers, json={"content": edited}
    )
    assert resp.status_code == 200
    assert resp.json()["content"]["epics"][0]["stories"][0]["effort"] == 13


def test_roadmap_packs_into_sprints(client, auth_headers, monkeypatch):
    """The roadmap endpoint returns capacity-bounded sprints from the saved stories."""
    monkeypatch.setattr("app.routers.stories.generate_stories", lambda **kwargs: FAKE_STORIES)
    project_id = _create_project(client, auth_headers)
    _generate_prd(client, auth_headers, project_id, monkeypatch)
    client.post(f"/projects/{project_id}/stories/generate", headers=auth_headers)

    resp = client.post(
        f"/projects/{project_id}/stories/roadmap", headers=auth_headers, json={"capacity": 3}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["capacity"] == 3
    # effort 3 + effort 2 can't both fit in capacity 3 → at least 2 sprints.
    assert len(body["sprints"]) >= 2

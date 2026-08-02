"""
Tests for the RAG document endpoints.

The EMBEDDING call is mocked (like Gemini elsewhere) so tests are fast and offline. Vector
SIMILARITY search runs only on Postgres, so for the generation-with-context test we mock
`retrieve_context` — we're verifying OUR wiring (upload → chunks stored, context passed to
generation), not pgvector itself.
"""

from tests.conftest import FAKE_PRD

# A fake 768-dim embedding, returned once per chunk. Value doesn't matter — we never do a
# real similarity search in tests.
FAKE_VECTOR = [0.1] * 768


def _project(client, auth_headers) -> int:
    return client.post(
        "/projects",
        headers=auth_headers,
        json={"title": "PM Copilot", "description": "AI PRDs.", "target_audience": "PMs."},
    ).json()["id"]


def _mock_embeddings(monkeypatch):
    """Make embed_texts return one FAKE_VECTOR per input text, wherever it's imported."""
    monkeypatch.setattr(
        "app.services.rag_service.embed_texts",
        lambda texts: [FAKE_VECTOR for _ in texts],
    )


def test_upload_markdown_creates_chunks(client, auth_headers, monkeypatch):
    """Uploading a Markdown file stores a document and at least one embedded chunk."""
    _mock_embeddings(monkeypatch)
    pid = _project(client, auth_headers)

    resp = client.post(
        f"/projects/{pid}/documents",
        headers=auth_headers,
        files={"file": ("spec.md", b"# Vision\nBuild the best PRD tool for founders.", "text/markdown")},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["filename"] == "spec.md"
    assert body["chunk_count"] >= 1


def test_unsupported_file_type_rejected(client, auth_headers, monkeypatch):
    """A file that isn't PDF/Markdown is rejected with 400 (client error)."""
    _mock_embeddings(monkeypatch)
    pid = _project(client, auth_headers)

    resp = client.post(
        f"/projects/{pid}/documents",
        headers=auth_headers,
        files={"file": ("data.exe", b"\x00\x01", "application/octet-stream")},
    )
    assert resp.status_code == 400


def test_list_and_delete_documents(client, auth_headers, monkeypatch):
    _mock_embeddings(monkeypatch)
    pid = _project(client, auth_headers)
    doc_id = client.post(
        f"/projects/{pid}/documents",
        headers=auth_headers,
        files={"file": ("notes.md", b"Some reference notes about the domain.", "text/markdown")},
    ).json()["id"]

    listed = client.get(f"/projects/{pid}/documents", headers=auth_headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    deleted = client.delete(f"/projects/{pid}/documents/{doc_id}", headers=auth_headers)
    assert deleted.status_code == 204
    assert client.get(f"/projects/{pid}/documents", headers=auth_headers).json() == []


def test_prd_generation_uses_retrieved_context(client, auth_headers, monkeypatch):
    """When documents exist, PRD generation retrieves context and passes it to Gemini."""
    _mock_embeddings(monkeypatch)

    # Capture the context the generator receives.
    captured = {}

    def fake_generate_prd(**kwargs):
        captured["context"] = kwargs.get("context")
        return FAKE_PRD

    monkeypatch.setattr("app.routers.prd.generate_prd", fake_generate_prd)
    monkeypatch.setattr(
        "app.routers.prd.retrieve_context",
        lambda db, project_id, query, k=5: {
            "context": "Grounding text from the user's doc.",
            "documents": ["spec.md"],
        },
    )

    pid = _project(client, auth_headers)
    # Upload a doc so `project.documents` is non-empty (triggers retrieval).
    client.post(
        f"/projects/{pid}/documents",
        headers=auth_headers,
        files={"file": ("spec.md", b"Reference material.", "text/markdown")},
    )

    resp = client.post(f"/projects/{pid}/prd/generate", headers=auth_headers)
    assert resp.status_code == 200
    # The retrieved context reached the generator, and the used-docs header is set.
    assert captured["context"] == "Grounding text from the user's doc."
    assert resp.headers.get("X-Context-Documents") == "spec.md"

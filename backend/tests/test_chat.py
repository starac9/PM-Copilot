"""Tests for the public FAQ chat and the PM AI mentor endpoints (LLM always mocked)."""

from app.services.llm_service import LLMError


def test_mentor_returns_reply_and_passes_topic(client, monkeypatch):
    seen = {}

    def fake(messages, topic=""):
        seen["messages"], seen["topic"] = messages, topic
        return "### RICE\nReach x Impact x Confidence / Effort."

    monkeypatch.setattr("app.routers.chat.mentor_reply", fake)
    resp = client.post(
        "/chat/mentor",
        json={"messages": [{"role": "user", "content": "What is RICE?"}], "topic": "Prioritization"},
    )
    assert resp.status_code == 200
    assert resp.json()["reply"].startswith("### RICE")
    assert seen["topic"] == "Prioritization"
    assert seen["messages"] == [{"role": "user", "content": "What is RICE?"}]


def test_mentor_does_not_require_auth_or_topic(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.mentor_reply", lambda m, t="": "ok")
    resp = client.post("/chat/mentor", json={"messages": [{"role": "user", "content": "hi"}]})
    assert resp.status_code == 200


def test_mentor_llm_failure_is_502_with_reason(client, monkeypatch):
    def boom(messages, topic=""):
        raise LLMError("groq/x: rate limit / quota exceeded (429)")

    monkeypatch.setattr("app.routers.chat.mentor_reply", boom)
    resp = client.post("/chat/mentor", json={"messages": [{"role": "user", "content": "hi"}]})
    assert resp.status_code == 502
    assert "429" in resp.json()["detail"]


def test_mentor_rejects_empty_and_oversized_input(client):
    assert client.post("/chat/mentor", json={"messages": []}).status_code == 422
    big = [{"role": "user", "content": "x" * 8001}]
    assert client.post("/chat/mentor", json={"messages": big}).status_code == 422

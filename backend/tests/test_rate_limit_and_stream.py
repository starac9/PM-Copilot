"""Rate limiting on AI endpoints, and the streaming PM AI Chat endpoint (LLM mocked)."""

import pytest

from app.core.config import settings
from app.services import llm_service
from app.services.llm_service import LLMError
from tests.conftest import FAKE_PRD

ASK = {"messages": [{"role": "user", "content": "What is RICE?"}]}


def test_chat_is_rate_limited_per_ip(client, monkeypatch):
    monkeypatch.setattr(settings, "CHAT_RATE_LIMIT_PER_HOUR", 2)
    monkeypatch.setattr("app.routers.chat.chat_reply", lambda m: "ok")
    assert client.post("/chat", json=ASK).status_code == 200
    assert client.post("/chat", json=ASK).status_code == 200
    blocked = client.post("/chat", json=ASK)
    assert blocked.status_code == 429
    assert "limit of 2 AI questions per hour" in blocked.json()["detail"]
    assert int(blocked.headers["Retry-After"]) > 0
    # A different client IP has its own budget.
    other = client.post("/chat", json=ASK, headers={"X-Forwarded-For": "203.0.113.9"})
    assert other.status_code == 200


def test_mentor_shares_the_chat_budget(client, monkeypatch):
    monkeypatch.setattr(settings, "CHAT_RATE_LIMIT_PER_HOUR", 1)
    monkeypatch.setattr("app.routers.chat.mentor_reply", lambda m, t="": "ok")
    assert client.post("/chat/mentor", json=ASK).status_code == 200
    assert client.post("/chat/mentor", json=ASK).status_code == 429


def test_generation_is_rate_limited_per_user(client, auth_headers, monkeypatch):
    monkeypatch.setattr(settings, "GENERATION_RATE_LIMIT_PER_HOUR", 1)
    monkeypatch.setattr("app.routers.prd.generate_prd", lambda **k: FAKE_PRD)
    pid = client.post(
        "/projects",
        headers=auth_headers,
        json={"title": "T", "description": "D", "target_audience": "A"},
    ).json()["id"]
    assert client.post(f"/projects/{pid}/prd/generate", headers=auth_headers).status_code == 200
    assert client.post(f"/projects/{pid}/prd/generate", headers=auth_headers).status_code == 429


def test_mentor_stream_returns_chunks(client, monkeypatch):
    monkeypatch.setattr(
        "app.routers.chat.mentor_stream", lambda m, t="": iter(["### RICE\n", "Reach × Impact"])
    )
    resp = client.post("/chat/mentor/stream", json=ASK)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/plain")
    assert resp.text == "### RICE\nReach × Impact"


def test_mentor_stream_unavailable_is_clean_502(client, monkeypatch):
    def boom(m, t=""):
        raise LLMError("gemini/x: rate limit / quota exceeded (429)")

    monkeypatch.setattr("app.routers.chat.mentor_stream", boom)
    resp = client.post("/chat/mentor/stream", json=ASK)
    assert resp.status_code == 502
    assert "429" in resp.json()["detail"]


def test_mentor_stream_interrupted_mid_answer_appends_note(client, monkeypatch):
    def flaky():
        yield "Partial answer"
        raise RuntimeError("connection reset")

    monkeypatch.setattr("app.routers.chat.mentor_stream", lambda m, t="": flaky())
    resp = client.post("/chat/mentor/stream", json=ASK)
    assert resp.status_code == 200
    assert resp.text.startswith("Partial answer")
    assert "cut off" in resp.text


@pytest.fixture
def stream_providers(monkeypatch):
    monkeypatch.setattr(llm_service.settings, "LLM_PROVIDER", "gemini")
    monkeypatch.setattr(llm_service.settings, "GEMINI_API_KEY", "k")
    monkeypatch.setattr(llm_service.settings, "GROQ_API_KEY", "")
    monkeypatch.setattr(llm_service.settings, "GEMINI_MODEL", "gemini-a")
    monkeypatch.setattr(llm_service.settings, "GEMINI_FALLBACK_MODELS", "gemini-b")
    calls = []
    return calls


def test_stream_falls_back_before_first_token(stream_providers, monkeypatch):
    calls = stream_providers

    class Quota(Exception):
        status_code = 429

    def fake_stream(prompt, system, model):
        calls.append(model)
        if model != "gemini-b":
            raise Quota("quota")
        yield "Hello "
        yield "world"

    monkeypatch.setattr(llm_service, "_STREAMERS", {"gemini": fake_stream, "groq": fake_stream})
    assert "".join(llm_service.mentor_stream([{"role": "user", "content": "hi"}])) == "Hello world"
    assert calls[-1] == "gemini-b"


def test_stream_raises_when_nothing_starts(stream_providers, monkeypatch):
    def empty(prompt, system, model):
        return iter([])

    monkeypatch.setattr(llm_service, "_STREAMERS", {"gemini": empty, "groq": empty})
    with pytest.raises(LLMError, match="empty response"):
        llm_service.mentor_stream([{"role": "user", "content": "hi"}])


def test_frontend_origins_parsing(monkeypatch):
    monkeypatch.setattr(settings, "FRONTEND_URL", "https://a.app/, http://localhost:5173 ,")
    assert settings.frontend_origins == ["https://a.app", "http://localhost:5173"]

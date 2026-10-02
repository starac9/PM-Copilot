"""Tests for llm_service's retry + provider/model fallback (no network: callers are faked)."""

import json

import pytest

from app.services import llm_service
from app.services.llm_service import LLMError, chat_reply, generate_prd
from tests.conftest import FAKE_PRD


class FakeAPIError(Exception):
    """Mimics an SDK error that carries an HTTP status code."""

    def __init__(self, code, message="boom"):
        super().__init__(message)
        self.status_code = code


@pytest.fixture
def providers(monkeypatch):
    """Configure gemini (primary) + groq keys and record every (provider, model) call."""
    monkeypatch.setattr(llm_service.settings, "LLM_PROVIDER", "gemini")
    monkeypatch.setattr(llm_service.settings, "GEMINI_API_KEY", "g-key")
    monkeypatch.setattr(llm_service.settings, "GROQ_API_KEY", "q-key")
    monkeypatch.setattr(llm_service.settings, "GEMINI_MODEL", "gemini-2.0-flash")  # stale env
    monkeypatch.setattr(llm_service.settings, "GROQ_MODEL", "llama-3.3-70b-versatile")
    monkeypatch.setattr(llm_service.time, "sleep", lambda s: None)

    calls = []
    behaviours = {}

    def make(provider):
        def fake(prompt, schema, system, model):
            calls.append((provider, model))
            result = behaviours.get((provider, model), FakeAPIError(500))
            if isinstance(result, Exception):
                raise result
            return result

        return fake

    monkeypatch.setattr(
        llm_service, "_CALLERS", {"gemini": make("gemini"), "groq": make("groq")}
    )
    return calls, behaviours


def test_retired_model_falls_back_to_default_model(providers):
    calls, behaviours = providers
    behaviours[("gemini", "gemini-2.0-flash")] = FakeAPIError(404)
    behaviours[("gemini", llm_service._DEFAULT_MODELS["gemini"])] = json.dumps(FAKE_PRD)

    assert generate_prd("T", "D", "A") == FAKE_PRD
    # 404 is not retried — it moves straight to the default model.
    assert calls == [("gemini", "gemini-2.0-flash"), ("gemini", llm_service._DEFAULT_MODELS["gemini"])]


def test_bad_key_falls_back_to_other_provider(providers):
    calls, behaviours = providers
    behaviours[("gemini", "gemini-2.0-flash")] = FakeAPIError(401)
    behaviours[("gemini", llm_service._DEFAULT_MODELS["gemini"])] = FakeAPIError(401)
    behaviours[("groq", "llama-3.3-70b-versatile")] = "```json\n" + json.dumps(FAKE_PRD) + "\n```"

    assert generate_prd("T", "D", "A") == FAKE_PRD
    assert calls[-1] == ("groq", "llama-3.3-70b-versatile")


def test_malformed_json_is_retried_once(providers):
    calls, behaviours = providers
    replies = iter(["{not json", json.dumps(FAKE_PRD)])
    model = "gemini-2.0-flash"

    def flaky(prompt, schema, system, m):
        calls.append(("gemini", m))
        return next(replies)

    llm_service._CALLERS["gemini"] = flaky
    assert generate_prd("T", "D", "A") == FAKE_PRD
    assert calls == [("gemini", model), ("gemini", model)]


def test_error_message_explains_every_failure(providers):
    _, behaviours = providers
    behaviours[("gemini", "gemini-2.0-flash")] = FakeAPIError(404)
    behaviours[("gemini", llm_service._DEFAULT_MODELS["gemini"])] = FakeAPIError(429)
    behaviours[("groq", "llama-3.3-70b-versatile")] = FakeAPIError(401)

    with pytest.raises(LLMError) as info:
        chat_reply([{"role": "user", "content": "hi"}])
    message = str(info.value)
    assert "gemini/gemini-2.0-flash: model not found" in message
    assert "rate limit / quota exceeded (429)" in message
    assert "groq/llama-3.3-70b-versatile: invalid API key (401)" in message


def test_fallback_provider_skipped_without_key(providers, monkeypatch):
    calls, behaviours = providers
    monkeypatch.setattr(llm_service.settings, "GROQ_API_KEY", "")
    with pytest.raises(LLMError):
        generate_prd("T", "D", "A")
    assert all(provider == "gemini" for provider, _ in calls)


def test_gemini_bad_key_is_described_as_invalid_key():
    exc = FakeAPIError(400, "400 INVALID_ARGUMENT. API key not valid. Please pass a valid API key.")
    assert "invalid API key" in llm_service._describe("gemini", "m", exc)

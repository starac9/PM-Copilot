"""
The single interface for LLM text generation (PRDs, user stories).

Provider-isolated: routers call `generate_prd()` / `generate_stories()` and never know or
care which backend produced the JSON. `settings.LLM_PROVIDER` selects the provider at
runtime, so switching Gemini ⇄ Groq is a config change, not a code change.

STRICT JSON, two ways:
  * Gemini — native `response_schema` + `response_mime_type="application/json"`.
  * Groq   — JSON mode (`response_format={"type": "json_object"}`) with the schema embedded
             in the system prompt (JSON mode guarantees valid JSON, not a specific shape).
In BOTH cases we then parse and validate the result against our Pydantic schema and retry
once, so a malformed or off-schema reply is caught here — never trusted downstream.

RESILIENCE: every call walks a list of (provider, model) candidates — the configured model,
then the built-in default model (env vars on the host override config defaults, so a stale
GEMINI_MODEL/GROQ_MODEL pointing at a shut-down model would otherwise break every call), then
the other provider if it has an API key. Errors that can't succeed on retry (bad key, model
not found) skip straight to the next candidate instead of burning quota on a retry.
"""

from __future__ import annotations

import json
import logging
import re
import time

from app.core.config import Settings, settings
from app.schemas.artifact import ArtifactContent
from app.schemas.prd import PRDContent
from app.schemas.story import StorySet
from app.services.prompts import (
    ARTIFACT_SPECS,
    ARTIFACT_SYSTEM_BASE,
    PRD_SYSTEM_INSTRUCTION,
    STORIES_SYSTEM_INSTRUCTION,
    build_artifact_prompt,
    build_prd_prompt,
    build_stories_prompt,
)

logger = logging.getLogger(__name__)


class LLMError(Exception):
    """Raised when the LLM fails after our retry. Routers turn this into a clean HTTP 502.

    A single, provider-agnostic error type means the rest of the app never has to know
    about Google's or Groq's specific SDK error classes.
    """


# Backwards-compatible alias: earlier code/tests referred to this as GeminiError.
GeminiError = LLMError


# --- Lazy client singletons (created on first use so unused providers cost nothing) ---
_gemini_client = None
_groq_client = None


def _get_gemini():
    global _gemini_client
    if _gemini_client is None:
        from google import genai

        _gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _gemini_client


def _get_groq():
    global _groq_client
    if _groq_client is None:
        from groq import Groq

        _groq_client = Groq(api_key=settings.GROQ_API_KEY)
    return _groq_client


def _generate_gemini(prompt: str, schema, system_instruction: str, model: str) -> str:
    """Ask Gemini for JSON (schema-constrained when `schema` is given) or plain text.

    google-genai ≥ 2.0 requires `config` to be a `types.GenerateContentConfig`
    object (or a dict that Pydantic can coerce into one). Passing a raw dict worked
    in v0.8 but silently fails in v2. We use the typed object for forward-compat.
    """
    from google.genai import types

    if schema is not None:
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=schema,
            system_instruction=system_instruction,
            temperature=0.7,
        )
    else:
        config = types.GenerateContentConfig(system_instruction=system_instruction, temperature=0.5)
    response = _get_gemini().models.generate_content(model=model, contents=prompt, config=config)
    if not response.text:
        raise ValueError("Gemini returned an empty response (possibly blocked or truncated).")
    return response.text


def _generate_groq(prompt, schema, system_instruction: str, model: str) -> str:
    """Ask Groq for JSON (JSON mode, when `schema` is given) or plain text.

    JSON mode guarantees syntactically valid JSON but not a particular shape, so we embed
    the model's JSON Schema in the system prompt to steer the structure; the Pydantic
    validation in `_generate_structured` is what actually enforces it. `prompt` may also be
    a list of chat messages (used by the chatbot).
    """
    system = system_instruction
    extra = {}
    if schema is not None:
        system = (
            f"{system_instruction}\n\n"
            "Return ONLY a single JSON object that conforms to this JSON Schema "
            "(no markdown, no commentary):\n"
            f"{json.dumps(schema.model_json_schema())}"
        )
        extra["response_format"] = {"type": "json_object"}
    if model.startswith("openai/gpt-oss"):
        # Reasoning model: its hidden reasoning tokens count against max_tokens, so keep it
        # brief or a short chat reply can come back empty.
        extra["reasoning_effort"] = "low"
    messages = prompt if isinstance(prompt, list) else [{"role": "user", "content": prompt}]
    response = _get_groq().chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": system}, *messages],
        temperature=0.7 if schema is not None else 0.5,
        max_tokens=8192 if schema is not None else 2048,
        **extra,
    )
    content = response.choices[0].message.content
    if not content:
        raise ValueError("Groq returned an empty response.")
    return content


_CALLERS = {"gemini": _generate_gemini, "groq": _generate_groq}
_DEFAULT_MODELS = {
    "gemini": Settings.model_fields["GEMINI_MODEL"].default,
    "groq": Settings.model_fields["GROQ_MODEL"].default,
}


def _candidates() -> list[tuple[str, str]]:
    """Ordered (provider, model) pairs to try: configured provider first, other one after."""
    configured = {"gemini": settings.GEMINI_MODEL, "groq": settings.GROQ_MODEL}
    keys = {"gemini": settings.GEMINI_API_KEY, "groq": settings.GROQ_API_KEY}
    primary = "groq" if settings.LLM_PROVIDER.lower() == "groq" else "gemini"
    order = [primary, "gemini" if primary == "groq" else "groq"]

    pairs: list[tuple[str, str]] = []
    for provider in order:
        # The primary is always tried (so a missing key surfaces as an error); the fallback
        # provider only when it has a key.
        if provider != primary and not keys[provider]:
            continue
        for model in (configured[provider], _DEFAULT_MODELS[provider]):
            if model and (provider, model) not in pairs:
                pairs.append((provider, model))
    return pairs


def _status_code(exc: Exception) -> int | None:
    """Best-effort HTTP status from a google-genai or groq SDK exception."""
    for attr in ("status_code", "code"):
        value = getattr(exc, attr, None)
        if isinstance(value, int):
            return value
    match = re.match(r"\s*(\d{3})\b", str(exc))
    return int(match.group(1)) if match else None


def _describe(provider: str, model: str, exc: Exception) -> str:
    """A short, human-readable reason for one failed attempt (shown in the API error)."""
    code = _status_code(exc)
    if "API_KEY_INVALID" in str(exc) or "API key not valid" in str(exc):
        code = 401  # Gemini reports a bad key as 400 INVALID_ARGUMENT
    reason = {
        400: "rejected the request",
        401: "invalid API key",
        403: "API key not permitted",
        404: "model not found (retired or misspelled)",
        413: "request too large",
        429: "rate limit / quota exceeded",
    }.get(code)
    if reason is None:
        reason = "service error" if code and code >= 500 else str(exc).splitlines()[0][:160]
    return f"{provider}/{model}: {reason}" + (f" ({code})" if code else "")


def _call_with_fallback(call, what: str):
    """Run `call(provider, model)` across the candidates; return the first success.

    Per candidate: up to 2 attempts for retryable problems (bad JSON / schema mismatch, rate
    limits, 5xx). Auth errors and unknown models move straight to the next candidate.
    """
    failures: list[str] = []
    for provider, model in _candidates():
        for attempt in range(2):
            try:
                return call(provider, model)
            except Exception as exc:  # noqa: BLE001 - classify, then retry or fall through
                code = _status_code(exc)
                logger.warning("%s via %s/%s attempt %d failed: %r", what, provider, model, attempt + 1, exc)
                failures.append(_describe(provider, model, exc))
                if code in (400, 401, 403, 404, 413):
                    break  # won't succeed on retry with this provider/model
                if code == 429 and attempt == 0:
                    time.sleep(2)
    # De-duplicate while keeping order so the message stays short.
    raise LLMError("; ".join(dict.fromkeys(failures)) or "no LLM provider configured")


def _generate_structured(prompt: str, schema, system_instruction: str, what: str) -> dict:
    """Generate STRICT JSON matching `schema`, with retries and provider/model fallback.

    Shared by every structured generator (PRD, stories, artifacts) so retry, JSON parsing,
    schema validation, and error translation live in exactly one place.
    """

    def call(provider: str, model: str) -> dict:
        raw = _CALLERS[provider](prompt, schema, system_instruction, model)
        # Parse + validate here so a bad payload is caught now, not in the DB layer.
        return schema.model_validate(json.loads(_strip_fences(raw))).model_dump()

    return _call_with_fallback(call, what)


def _strip_fences(raw: str) -> str:
    """Tolerate a reply wrapped in ```json fences despite instructions."""
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\s*|\s*```$", "", text)
    return text


def generate_prd(title: str, description: str, target_audience: str, context: str = "") -> dict:
    """Generate a structured PRD for a product idea.

    Returns a plain dict matching `PRDContent`, ready to store as JSONB.

    Raises:
        LLMError: if the provider fails or returns unusable JSON after one retry.
    """
    prompt = build_prd_prompt(title, description, target_audience, context)
    return _generate_structured(prompt, PRDContent, PRD_SYSTEM_INSTRUCTION, "PRD")


def generate_stories(prd_content: dict, context: str = "") -> dict:
    """Generate epics + user stories (with suggested RICE inputs) from a saved PRD.

    Returns a plain dict matching `StorySet`. RICE scores/priorities are NOT included here —
    they're computed later in roadmap_service.

    Raises:
        LLMError: if the provider fails or returns unusable JSON after one retry.
    """
    prompt = build_stories_prompt(prd_content, context)
    return _generate_structured(prompt, StorySet, STORIES_SYSTEM_INSTRUCTION, "stories")


def generate_artifact(
    artifact_type: str,
    title: str,
    description: str,
    target_audience: str,
    prd_content: dict | None = None,
    context: str = "",
) -> dict:
    """Generate any PM artifact (strategy, market analysis, OKRs, GTM, …) for a project.

    The artifact type is looked up in the prompts registry (ARTIFACT_SPECS); every type
    returns the same `ArtifactContent` shape (summary + titled sections), so this one
    function powers the entire PM-lifecycle workspace.

    Returns a plain dict matching `ArtifactContent`, ready to store as JSONB.

    Raises:
        LLMError: if the provider fails or returns unusable JSON after one retry.
        KeyError: if `artifact_type` is not a known type (callers validate first).
    """
    spec = ARTIFACT_SPECS[artifact_type]
    system = f"{ARTIFACT_SYSTEM_BASE} {spec['system']}"
    prompt = build_artifact_prompt(
        artifact_type, title, description, target_audience, prd_content, context
    )
    return _generate_structured(prompt, ArtifactContent, system, spec["label"])


# System prompt for the FAQ chatbot: friendly, on-brand, concise.
CHAT_SYSTEM_INSTRUCTION = (
    "You are the friendly in-app assistant for PM Copilot — an AI tool that turns a product "
    "idea into a structured PRD, user stories with RICE prioritization, a capacity-based "
    "sprint roadmap, and Markdown/Jira exports, with optional RAG over the user's uploaded "
    "documents. Answer questions about how PM Copilot works (FAQ) and general product-"
    "management questions. Be concise, warm, and practical. Use short paragraphs or bullet "
    "points. If you don't know something specific, say so briefly and suggest the closest "
    "helpful answer."
)


def chat_reply(messages: list[dict]) -> str:
    """Return a conversational reply for the FAQ chatbot (plain text, not JSON).

    Args:
        messages: the recent history as [{"role": "user"|"assistant", "content": str}, ...].

    Raises:
        LLMError: if the provider fails.
    """

    def call(provider: str, model: str) -> str:
        if provider == "groq":
            return _CALLERS["groq"](messages, None, CHAT_SYSTEM_INSTRUCTION, model).strip()
        # Gemini path: flatten the short history into a single prompt.
        history = "\n".join(f"{m['role']}: {m['content']}" for m in messages)
        return _CALLERS["gemini"](
            f"{history}\nassistant:", None, CHAT_SYSTEM_INSTRUCTION, model
        ).strip()

    return _call_with_fallback(call, "Chat")

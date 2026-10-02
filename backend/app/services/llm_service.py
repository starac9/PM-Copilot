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
"""

from __future__ import annotations

import json
import logging

from app.core.config import settings
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


def _generate_gemini(prompt: str, schema, system_instruction: str) -> str:
    """Ask Gemini for schema-constrained JSON and return the raw JSON string.

    google-genai ≥ 2.0 requires `config` to be a `types.GenerateContentConfig`
    object (or a dict that Pydantic can coerce into one). Passing a raw dict worked
    in v0.8 but silently fails in v2. We use the typed object for forward-compat.
    """
    from google.genai import types

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=schema,
        system_instruction=system_instruction,
        temperature=0.7,
    )
    response = _get_gemini().models.generate_content(
        model=settings.GEMINI_MODEL, contents=prompt, config=config
    )
    return response.text


def _generate_groq(prompt: str, schema, system_instruction: str) -> str:
    """Ask Groq (JSON mode) for JSON and return the raw JSON string.

    JSON mode guarantees syntactically valid JSON but not a particular shape, so we embed
    the model's JSON Schema in the system prompt to steer the structure; the Pydantic
    validation in `_generate_structured` is what actually enforces it.
    """
    schema_json = json.dumps(schema.model_json_schema())
    system = (
        f"{system_instruction}\n\n"
        "Return ONLY a single JSON object that conforms to this JSON Schema "
        "(no markdown, no commentary):\n"
        f"{schema_json}"
    )
    response = _get_groq().chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
    )
    return response.choices[0].message.content


def _generate_structured(prompt: str, schema, system_instruction: str, what: str) -> dict:
    """Generate STRICT JSON matching `schema` from the active provider, with one retry.

    Shared by every structured generator (PRD, stories) so retry, JSON parsing, schema
    validation, and error translation live in exactly one place.
    """
    use_groq = settings.LLM_PROVIDER.lower() == "groq"

    last_error: Exception | None = None
    for attempt in range(2):
        try:
            raw = (
                _generate_groq(prompt, schema, system_instruction)
                if use_groq
                else _generate_gemini(prompt, schema, system_instruction)
            )
            # Parse + validate here so a bad payload is caught now, not in the DB layer.
            data = json.loads(raw)
            return schema.model_validate(data).model_dump()
        except Exception as exc:  # noqa: BLE001 - any failure is retry-then-surface
            last_error = exc
            logger.warning("%s generation attempt %d failed: %s", what, attempt + 1, exc)
            continue

    raise LLMError(f"Failed to generate {what} after retry: {last_error}")


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
    try:
        if settings.LLM_PROVIDER.lower() == "groq":
            resp = _get_groq().chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[{"role": "system", "content": CHAT_SYSTEM_INSTRUCTION}, *messages],
                temperature=0.5,
                max_tokens=600,
            )
            return resp.choices[0].message.content.strip()

        # Gemini path: flatten the short history into a single prompt.
        from google.genai import types

        history = "\n".join(f"{m['role']}: {m['content']}" for m in messages)
        response = _get_gemini().models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=f"{history}\nassistant:",
            config=types.GenerateContentConfig(
                system_instruction=CHAT_SYSTEM_INSTRUCTION,
                temperature=0.5,
            ),
        )
        return response.text.strip()
    except Exception as exc:  # noqa: BLE001 - surface any provider failure uniformly
        logger.warning("Chat reply failed: %s", exc)
        raise LLMError(f"Chat failed: {exc}") from exc

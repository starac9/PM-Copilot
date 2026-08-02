"""
All Gemini prompts live here, isolated from code.

WHY a dedicated prompts file:
  - Prompt wording is the "product" of an AI feature; keeping it in one place makes it
    easy to review, tweak, and A/B test without touching application logic.
  - It documents the *prompt design* decisions for interviews and teammates.
  - In Phase 4 (RAG) we inject retrieved context here without changing service code.

PROMPT DESIGN NOTES (PRD generation):
  1. ROLE PRIMING: we open by casting the model as an experienced PM. Giving the model a
     persona reliably improves tone and domain vocabulary.
  2. STRICTNESS: we DON'T describe the JSON shape in prose. Instead we pass a
     `response_schema` to the API (see llm_service). That guarantees valid structure,
     so the prompt can focus on QUALITY, not formatting.
  3. CONCRETENESS: we explicitly ask for measurable metrics and MVP-focused scope,
     because vague PRDs are the most common failure mode.
  4. GROUNDING: we feed the user's exact idea (title/description/audience) so output is
     specific to their product, not generic boilerplate.
"""

# Defer annotation evaluation so modern union syntax (e.g. `dict | None`) works on 3.9.
from __future__ import annotations

# The system-style instruction that primes the model's role and quality bar.
PRD_SYSTEM_INSTRUCTION = (
    "You are an experienced Senior Product Manager who writes crisp, realistic Product "
    "Requirements Documents (PRDs). You favor MVP-focused scope, measurable success "
    "metrics, and honest risks. Avoid buzzwords and vague filler."
)


def build_prd_prompt(title: str, description: str, target_audience: str, context: str = "") -> str:
    """Assemble the user-facing prompt for generating a PRD.

    Args:
        title: The product idea's name.
        description: A short description of the idea.
        target_audience: Who the product is for.
        context: Optional retrieved reference text (used starting in Phase 4 / RAG).
                 Empty string in Phase 1.

    Returns:
        A single prompt string. The strict JSON shape is enforced separately via the
        response_schema, so we deliberately do NOT restate field names here.
    """
    # In Phase 4 this block will contain the user's own documents so the PRD matches
    # their domain and writing style. For now it's empty and adds nothing.
    context_block = ""
    if context.strip():
        context_block = (
            "\nUse the following reference material from the user's own documents to match "
            "their domain, terminology, and style:\n"
            "-----\n"
            f"{context}\n"
            "-----\n"
        )

    return (
        "Write a Product Requirements Document for the following product idea.\n\n"
        f"Product title: {title}\n"
        f"Description: {description}\n"
        f"Target audience: {target_audience}\n"
        f"{context_block}\n"
        "Requirements for a strong PRD:\n"
        "- Problem statement: sharp and specific to this product.\n"
        "- Personas: 2-3, each with concrete, believable pain points.\n"
        "- Success metrics: 3-5, each MEASURABLE (include a number or clear signal).\n"
        "- Scope: keep in-scope tight and MVP-focused; move nice-to-haves to out-of-scope.\n"
        "- Risks & assumptions: name the real risks that could sink this, not platitudes.\n"
    )


# ---------------------------------------------------------------------------
# Story generation (Phase 2)
# ---------------------------------------------------------------------------

# System instruction for turning a PRD into an engineering backlog. The persona shifts to
# a PM working WITH engineers, because good stories are testable and vertically sliced.
STORIES_SYSTEM_INSTRUCTION = (
    "You are a Senior Product Manager breaking a PRD into an actionable engineering "
    "backlog. You write vertically-sliced user stories in the 'As a <user>, I want <goal>, "
    "so that <benefit>' format, each with clear, testable acceptance criteria. You group "
    "stories under a small number of coherent epics."
)


def build_stories_prompt(prd_content: dict, context: str = "") -> str:
    """Assemble the prompt for generating epics + user stories from a PRD.

    Args:
        prd_content: the stored PRD dict (problem statement, personas, scope, etc.). We
            feed it in as JSON-ish text so the stories are grounded in the actual PRD.
        context: optional RAG reference text (Phase 4); empty otherwise.

    PROMPT DESIGN NOTES:
      1. GROUNDING: we pass the real PRD so stories map to its scope and personas, not a
         generic backlog.
      2. RICE — SUGGEST, DON'T DECIDE: we ask the model to *estimate* reach/impact/
         confidence/effort as a starting point. The user then edits them and OUR code
         computes the score/priority (see roadmap_service). We say this explicitly so the
         model returns sensible numeric ranges, not prose.
      3. STRICTNESS: the JSON shape is enforced by the response_schema (StorySet), so we
         focus the prompt on QUALITY (slicing, testable criteria) not formatting.
    """
    import json

    context_block = ""
    if context.strip():
        context_block = (
            "\nReference material from the user's own documents (match their domain and "
            "terminology):\n-----\n" + context + "\n-----\n"
        )

    return (
        "Break the following Product Requirements Document into epics and user stories.\n\n"
        "PRD (as JSON):\n"
        f"{json.dumps(prd_content, indent=2)}\n"
        f"{context_block}\n"
        "Requirements:\n"
        "- Create 3-6 epics; each epic groups 2-5 related user stories.\n"
        "- Every story: 'As a <user>, I want <goal>, so that <benefit>' + 2-4 testable "
        "acceptance criteria.\n"
        "- For each story, ESTIMATE initial RICE inputs the team can refine later:\n"
        "    reach = approx users affected per period (a count),\n"
        "    impact = one of 0.25, 0.5, 1, 2, 3,\n"
        "    confidence = a percentage 0-100,\n"
        "    effort = story points (1, 2, 3, 5, 8).\n"
        "- Keep stories vertically sliced (shippable), not technical tasks.\n"
    )


# ---------------------------------------------------------------------------
# PM Artifacts (the full PM lifecycle)
# ---------------------------------------------------------------------------
#
# Beyond the PRD → stories → roadmap spine, a product manager also does discovery, sets
# strategy, sizes the market, defines OKRs, builds personas, plans launches, and communicates
# to stakeholders. Each of those is, structurally, "a headline + titled bulleted sections".
#
# ARTIFACT_SPECS is the registry that turns PM Copilot into an end-to-end tool: each entry is
# a role (`system`) plus the exact sections we want. Adding a new PM capability = one entry
# here. The uniform ArtifactContent schema (see schemas/artifact.py) enforces the shape, so
# these prompts focus purely on QUALITY and WHICH sections to produce.

ARTIFACT_SPECS: dict[str, dict] = {
    "discovery": {
        "label": "Discovery Plan",
        "description": "Assumptions to test, research questions, and an interview script.",
        "system": "You are a product discovery coach who de-risks ideas before a line of code is written. You prize testable hypotheses over opinions.",
        "sections": [
            "Riskiest assumptions — the beliefs that, if wrong, sink the product",
            "Hypotheses to test — each phrased so it can be proven false",
            "Research questions — open, non-leading questions for users",
            "Interview script — 5-8 questions in a natural order",
            "Signals of success — what evidence would validate the idea",
        ],
    },
    "strategy": {
        "label": "Product Strategy",
        "description": "Vision, target market, value proposition, and strategic pillars.",
        "system": "You are a Head of Product setting a sharp, opinionated product strategy. You avoid buzzwords and make real trade-offs.",
        "sections": [
            "Vision — a one-paragraph north star for where this product is going",
            "Target market & segments — who we serve first and who we don't",
            "Value proposition — the unique value and why it matters now",
            "Strategic pillars — 3-4 themes that focus the roadmap",
            "Moats & advantages — what makes this durable over time",
        ],
    },
    "market": {
        "label": "Market & Competitors",
        "description": "Market landscape, key competitors, and differentiation.",
        "system": "You are a product strategist doing an honest competitive analysis. You name real categories of competitors and concrete gaps.",
        "sections": [
            "Market landscape — size, trends, and why now",
            "Competitors — 3-5 alternatives (including status-quo / DIY) and their weaknesses",
            "Differentiation — where this product wins and where it doesn't",
            "Positioning statement — a crisp 'for X who Y, we are Z' line",
            "Risks — market risks that could change the picture",
        ],
    },
    "okrs": {
        "label": "OKRs & Metrics",
        "description": "Objectives, key results, north-star metric, and guardrails.",
        "system": "You are a data-driven PM defining outcome-based OKRs. Key results are measurable, ambitious-but-realistic, and never mere tasks.",
        "sections": [
            "Objective — one qualitative, inspiring goal for the next quarter",
            "Key results — 3-4 measurable outcomes with numbers",
            "North-star metric — the single number that best reflects value delivered",
            "Guardrail metrics — what we must NOT harm while chasing the objective",
            "Instrumentation — the events/data needed to measure the above",
        ],
    },
    "personas": {
        "label": "User Personas",
        "description": "Rich personas with goals, frustrations, and behaviors.",
        "system": "You are a UX-minded PM writing believable, specific personas grounded in real behavior — not demographic clichés.",
        "sections": [
            "Primary persona — name, role, and a one-line portrait",
            "Goals — what this persona is trying to achieve",
            "Frustrations — the pain points blocking them today",
            "Behaviors & context — how, when, and where they work",
            "Secondary persona — a brief contrasting second user",
        ],
    },
    "gtm": {
        "label": "Go-to-Market",
        "description": "Positioning, channels, launch phases, and messaging.",
        "system": "You are a product marketer planning a focused, realistic launch for a small team. You prefer one sharp channel over ten shallow ones.",
        "sections": [
            "Positioning & messaging — the core message and 2-3 proof points",
            "Target segment for launch — the beachhead audience",
            "Channels — the 2-3 highest-leverage acquisition channels",
            "Launch phases — pre-launch, launch, and post-launch actions",
            "Success criteria — the metrics that define a good launch",
        ],
    },
    "release_notes": {
        "label": "Release Notes",
        "description": "User-facing changelog: highlights, improvements, and fixes.",
        "system": "You are a PM writing clear, benefit-led release notes for end users. You describe value, not implementation details.",
        "sections": [
            "Headline — the one-line theme of this release",
            "New features — what users can now do, framed as benefits",
            "Improvements — refinements to existing behavior",
            "Fixes — notable bugs resolved",
        ],
    },
    "stakeholder_update": {
        "label": "Stakeholder Update",
        "description": "A status one-pager: progress, risks, and asks.",
        "system": "You are a PM writing a concise weekly stakeholder update for leadership. You lead with outcomes, are candid about risks, and make clear asks.",
        "sections": [
            "Summary — 2-3 sentences on where things stand",
            "Progress — what shipped or advanced recently",
            "Risks & blockers — honest issues and their mitigations",
            "Asks & decisions needed — what you need from stakeholders",
            "Next steps — the focus for the coming period",
        ],
    },
}


# System instruction shared across artifacts (per-type role is appended from the spec).
ARTIFACT_SYSTEM_BASE = (
    "You produce a focused product-management artifact as a short summary plus titled, "
    "bulleted sections. Be concrete and specific to THIS product — no generic filler, no "
    "buzzwords. Each bullet is one tight, useful idea."
)


def artifact_catalog() -> list[dict]:
    """Return the list of available artifact types (key/label/description) for the UI."""
    return [
        {"key": key, "label": spec["label"], "description": spec["description"]}
        for key, spec in ARTIFACT_SPECS.items()
    ]


def build_artifact_prompt(
    artifact_type: str,
    title: str,
    description: str,
    target_audience: str,
    prd_content: dict | None = None,
    context: str = "",
) -> str:
    """Assemble the prompt for a given artifact type, grounded in the project (and PRD/docs).

    The uniform ArtifactContent schema enforces the output shape, so this prompt only steers
    QUALITY and WHICH sections to produce (from the type's registry entry).
    """
    import json

    spec = ARTIFACT_SPECS[artifact_type]

    prd_block = ""
    if prd_content:
        prd_block = (
            "\nThe project already has a PRD — stay consistent with it:\n-----\n"
            + json.dumps(prd_content, indent=2)
            + "\n-----\n"
        )

    context_block = ""
    if context.strip():
        context_block = (
            "\nReference material from the user's own documents (match their domain and "
            "terminology):\n-----\n" + context + "\n-----\n"
        )

    sections = "\n".join(f"  - {s}" for s in spec["sections"])
    return (
        f"Create a '{spec['label']}' for the following product.\n\n"
        f"Product title: {title}\n"
        f"Description: {description}\n"
        f"Target audience: {target_audience}\n"
        f"{prd_block}"
        f"{context_block}\n"
        "Produce a one-sentence summary and these sections (in this order), each with 2-6 "
        "concrete bullets:\n"
        f"{sections}\n"
    )

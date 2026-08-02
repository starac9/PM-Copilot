"""
Deterministic PM logic — NO LLM involved.

This is a deliberate design choice: prioritization and planning must be reproducible and
explainable, so we compute them in plain Python instead of asking the model. The LLM only
suggests the raw RICE inputs; everything here is math the user can trust and audit.

Contains:
  * rice_score()      — the standard RICE formula.
  * jira_priority()   — map a story's rank into the fixed Jira priority buckets.
  * build_roadmap()   — greedily pack stories into sprints by priority, respecting capacity.
"""

from __future__ import annotations

# The EXACT five Jira priority values (order matters: highest → lowest). Phase 3's CSV
# export requires these precise strings, so we define them once here as the source of truth.
JIRA_PRIORITIES = ["Highest", "High", "Medium", "Low", "Lowest"]


def rice_score(story: dict) -> float:
    """Compute a story's RICE score from its four inputs.

    Score = (reach * impact * (confidence / 100)) / effort.
    Confidence is a percentage (0-100). Effort is guarded against zero so a mis-entered
    0 can't divide-by-zero; we treat it as a tiny cost instead.
    """
    reach = float(story.get("reach", 0) or 0)
    impact = float(story.get("impact", 0) or 0)
    confidence = float(story.get("confidence", 0) or 0)
    effort = float(story.get("effort", 0) or 0)
    effort = effort if effort > 0 else 0.5
    return (reach * impact * (confidence / 100.0)) / effort


def _flatten(content: dict) -> list[dict]:
    """Flatten epics → a single list of stories, tagging each with its epic + RICE score."""
    flat: list[dict] = []
    for epic in content.get("epics", []):
        for story in epic.get("stories", []):
            flat.append(
                {
                    "epic": epic.get("name", "Untitled epic"),
                    "title": story.get("title", "Untitled story"),
                    "effort": float(story.get("effort", 0) or 0) or 0.5,
                    "rice_score": rice_score(story),
                }
            )
    return flat


def jira_priority(rank: int, total: int) -> str:
    """Map a story's 0-based rank (0 = highest RICE) into one of the five Jira buckets.

    We split the ranked list into five roughly equal bands so the top stories get
    "Highest" and the bottom get "Lowest". This keeps the mapping deterministic and
    independent of the raw score magnitude.
    """
    if total <= 0:
        return "Medium"
    band = int(rank / total * len(JIRA_PRIORITIES))
    band = min(band, len(JIRA_PRIORITIES) - 1)  # guard the last element
    return JIRA_PRIORITIES[band]


def prioritized_stories(content: dict) -> list[dict]:
    """Return all stories sorted by RICE score (desc), each annotated with a priority."""
    flat = _flatten(content)
    flat.sort(key=lambda s: s["rice_score"], reverse=True)
    total = len(flat)
    for rank, story in enumerate(flat):
        story["priority"] = jira_priority(rank, total)
    return flat


def build_roadmap(content: dict, capacity: float) -> dict:
    """Arrange stories into sprints by priority, respecting per-sprint capacity.

    Greedy bin-packing: walk the RICE-sorted stories and add each to the current sprint if
    it fits; otherwise start a new sprint. A single story larger than the whole capacity
    gets a sprint to itself (we never drop work). Simple, predictable, and easy to explain.
    """
    stories = prioritized_stories(content)

    sprints: list[dict] = []
    current: list[dict] = []
    current_effort = 0.0

    for story in stories:
        effort = story["effort"]
        # Start a new sprint when adding this story would exceed capacity (and the current
        # sprint already has something — so an oversized story isn't stuck in an empty one).
        if current and current_effort + effort > capacity:
            sprints.append(_seal_sprint(len(sprints) + 1, current, current_effort))
            current, current_effort = [], 0.0
        current.append(story)
        current_effort += effort

    if current:
        sprints.append(_seal_sprint(len(sprints) + 1, current, current_effort))

    return {"capacity": capacity, "sprints": sprints}


def _seal_sprint(number: int, stories: list[dict], total_effort: float) -> dict:
    """Package a finished sprint into the RoadmapOut shape."""
    return {"number": number, "stories": stories, "total_effort": total_effort}

"""
Export helpers: turn a project's PRD + stories into downloadable files.

Pure functions (no DB, no network) so they're trivial to test and reuse. Two formats:
  * Markdown  — a readable document combining the PRD and the backlog.
  * Jira CSV  — one row per epic/story, with the EXACT priority enum Jira expects.

The Jira priority comes from roadmap_service.prioritized_stories(), so the values are the
canonical Highest/High/Medium/Low/Lowest and can never drift from our prioritization logic.
"""

from __future__ import annotations

import csv
import io

from app.services.roadmap_service import prioritized_stories

# Jira's fixed CSV columns, in the order Jira's importer expects them.
JIRA_COLUMNS = ["Summary", "Issue Type", "Description", "Priority", "Epic Link"]


def _bullets(items: list[str]) -> str:
    """Render a list as Markdown bullets (empty string if there are none)."""
    return "\n".join(f"- {item}" for item in items) if items else "_None_"


def build_markdown(title: str, prd: dict | None, stories: dict | None) -> str:
    """Assemble a full Markdown document for a project.

    Both `prd` and `stories` are optional so the export works even if only one has been
    generated. Sections are omitted cleanly when their data is missing.
    """
    lines: list[str] = [f"# {title}", ""]

    if prd:
        lines += ["## Product Requirements Document", ""]
        lines += ["### Problem statement", prd.get("problem_statement", ""), ""]

        lines += ["### Target personas", ""]
        for persona in prd.get("personas", []):
            lines += [f"**{persona.get('name', '')}** — {persona.get('description', '')}"]
            lines += [_bullets(persona.get("pain_points", [])), ""]

        lines += ["### Success metrics", _bullets(prd.get("success_metrics", [])), ""]

        scope = prd.get("scope", {})
        lines += ["### Scope", "", "**In scope**", _bullets(scope.get("in_scope", [])), ""]
        lines += ["**Out of scope**", _bullets(scope.get("out_of_scope", [])), ""]

        lines += ["### Risks & assumptions", _bullets(prd.get("risks_and_assumptions", [])), ""]

    if stories:
        lines += ["## User stories", ""]
        for epic in stories.get("epics", []):
            lines += [f"### Epic: {epic.get('name', '')}", ""]
            for story in epic.get("stories", []):
                lines += [f"#### {story.get('title', '')}", story.get("description", ""), ""]
                lines += ["**Acceptance criteria**", _bullets(story.get("acceptance_criteria", []))]
                # Show the RICE inputs inline so the exported doc is self-explanatory.
                lines += [
                    f"_RICE — reach {story.get('reach')}, impact {story.get('impact')}, "
                    f"confidence {story.get('confidence')}%, effort {story.get('effort')}_",
                    "",
                ]

    return "\n".join(lines).strip() + "\n"


def build_jira_csv(stories: dict) -> str:
    """Build a Jira-compatible CSV string from a story set.

    We emit one 'Epic' row per epic followed by its 'Story' rows, and set each story's
    'Epic Link' to its epic name so Jira's importer nests them correctly. The Priority
    column uses our deterministic RICE-based buckets.
    """
    # Map (epic, title) → priority using the deterministic ranking.
    ranked = prioritized_stories(stories)
    priority_by_key = {(s["epic"], s["title"]): s["priority"] for s in ranked}

    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=JIRA_COLUMNS)
    writer.writeheader()

    for epic in stories.get("epics", []):
        epic_name = epic.get("name", "")
        # The epic itself as an Epic issue.
        writer.writerow(
            {
                "Summary": epic_name,
                "Issue Type": "Epic",
                "Description": "",
                "Priority": "",
                "Epic Link": "",
            }
        )
        for story in epic.get("stories", []):
            title = story.get("title", "")
            # Fold acceptance criteria into the description so nothing is lost on import.
            criteria = story.get("acceptance_criteria", [])
            description = story.get("description", "")
            if criteria:
                description += "\n\nAcceptance criteria:\n" + "\n".join(f"- {c}" for c in criteria)
            writer.writerow(
                {
                    "Summary": title,
                    "Issue Type": "Story",
                    "Description": description,
                    "Priority": priority_by_key.get((epic_name, title), "Medium"),
                    "Epic Link": epic_name,
                }
            )

    return buffer.getvalue()

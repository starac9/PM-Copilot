"""
Unit tests for the deterministic roadmap logic (no LLM, no DB, no mocks needed).

These verify the MATH the app promises: RICE scoring, priority buckets, and capacity-based
sprint packing. This is exactly the logic we deliberately kept out of the LLM.
"""

from app.services.roadmap_service import (
    JIRA_PRIORITIES,
    build_roadmap,
    prioritized_stories,
    rice_score,
)


def test_rice_score_formula():
    """Score = reach * impact * (confidence/100) / effort."""
    story = {"reach": 1000, "impact": 2, "confidence": 50, "effort": 5}
    # 1000 * 2 * 0.5 / 5 = 200
    assert rice_score(story) == 200


def test_rice_score_handles_zero_effort():
    """A mis-entered effort of 0 must not divide by zero."""
    story = {"reach": 100, "impact": 1, "confidence": 100, "effort": 0}
    assert rice_score(story) > 0  # treated as a small effort, no crash


def _content():
    return {
        "epics": [
            {
                "name": "Onboarding",
                "stories": [
                    {"title": "High value", "reach": 1000, "impact": 3, "confidence": 100, "effort": 2},
                    {"title": "Low value", "reach": 10, "impact": 0.25, "confidence": 50, "effort": 8},
                ],
            }
        ]
    }


def test_prioritized_stories_sorted_desc_with_priority():
    """Stories come back sorted by RICE (highest first) and tagged with a Jira priority."""
    result = prioritized_stories(_content())
    assert [s["title"] for s in result] == ["High value", "Low value"]
    assert result[0]["rice_score"] > result[1]["rice_score"]
    # Every priority must be one of the exact five Jira values.
    assert all(s["priority"] in JIRA_PRIORITIES for s in result)


def test_build_roadmap_respects_capacity():
    """Stories are packed into sprints without exceeding the capacity per sprint."""
    roadmap = build_roadmap(_content(), capacity=5)
    # High value (effort 2) fits sprint 1; Low value (effort 8) exceeds remaining → sprint 2.
    assert len(roadmap["sprints"]) == 2
    for sprint in roadmap["sprints"]:
        # Each sprint holds either one oversized story or stays within capacity.
        assert sprint["total_effort"] <= 5 or len(sprint["stories"]) == 1
    # Highest-priority story lands in the first sprint.
    assert roadmap["sprints"][0]["stories"][0]["title"] == "High value"

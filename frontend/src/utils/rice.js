// RICE scoring on the frontend — a deliberate MIRROR of backend/app/services/
// roadmap_service.py:rice_score. We recompute it live in the browser so editing a RICE
// input updates the score and re-sorts stories instantly, with no round-trip.
//
// Score = (reach * impact * (confidence / 100)) / effort.
// Keeping this in one tiny module (not inline in components) makes it easy to keep in
// sync with the backend and to unit-test if we ever add frontend tests.
export function riceScore({ reach, impact, confidence, effort }) {
  const r = Number(reach) || 0;
  const i = Number(impact) || 0;
  const c = Number(confidence) || 0;
  // Guard divide-by-zero the same way the backend does.
  const e = Number(effort) > 0 ? Number(effort) : 0.5;
  return (r * i * (c / 100)) / e;
}

// Sort a copy of the stories by RICE score, highest first (does not mutate the input).
export function sortByRice(stories) {
  return [...stories].sort((a, b) => riceScore(b) - riceScore(a));
}

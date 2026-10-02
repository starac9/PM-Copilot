// One user story card with editable RICE inputs. The computed RICE score is shown live
// and updates as the user types — the parent owns the data and passes an onChange that
// updates the story in place, which triggers a re-sort in the board.
import { Check } from "lucide-react";

import { riceScore } from "../utils/rice.js";

// The four RICE inputs and their little helper hints (matches the backend convention).
const RICE_FIELDS = [
  { key: "reach", label: "Reach", hint: "users/period" },
  { key: "impact", label: "Impact", hint: "0.25–3" },
  { key: "confidence", label: "Confidence", hint: "0–100%" },
  { key: "effort", label: "Effort", hint: "points" },
];

export default function StoryCard({ story, onChange }) {
  const score = riceScore(story);

  // Keep the raw input (so a field can be cleared and retyped); riceScore() coerces for the
  // live score and StoriesView converts everything back to numbers on save.
  const setField = (key, value) => onChange({ ...story, [key]: value });

  return (
    <div className="card space-y-3 p-4 transition hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-heading">{story.title}</p>
        {/* The live RICE score — the whole point of doing this in the browser. */}
        <span className="badge shrink-0 bg-grass-400 font-mono text-ink shadow-sm">
          RICE {score.toFixed(score < 10 ? 1 : 0)}
        </span>
      </div>

      <p className="text-sm text-muted">{story.description}</p>

      {story.acceptance_criteria?.length > 0 && (
        <ul className="space-y-1 text-xs text-muted">
          {story.acceptance_criteria.map((ac, i) => (
            <li key={i} className="flex gap-1.5">
              <Check size={13} strokeWidth={2.5} className="mt-0.5 shrink-0 text-grass-500" />
              <span>{ac}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="rule grid grid-cols-2 gap-2 pt-3 sm:grid-cols-4">
        {RICE_FIELDS.map(({ key, label, hint }) => (
          <label key={key} className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted">
            {label}
            <input
              type="number"
              step="any"
              min="0"
              className="input mt-1 px-2 py-1.5 font-sans text-sm normal-case tracking-normal"
              value={story[key]}
              onChange={(e) => setField(key, e.target.value)}
            />
            <span className="mt-0.5 block normal-case tracking-normal text-slate-400">{hint}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

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

  // Update one field, coercing to a number so the score math stays numeric.
  const setField = (key, value) => onChange({ ...story, [key]: Number(value) });

  return (
    <div className="card card-hover space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-heading">{story.title}</p>
        {/* The live RICE score — the whole point of doing this in the browser. */}
        <span className="badge shrink-0 bg-grass-400 text-ink shadow-sm">
          RICE {score.toFixed(0)}
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

      <div className="grid grid-cols-4 gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        {RICE_FIELDS.map(({ key, label, hint }) => (
          <label key={key} className="text-xs font-medium text-muted">
            {label}
            <input
              type="number"
              step="any"
              min="0"
              className="input mt-1 px-2 py-1.5 text-sm"
              value={story[key]}
              onChange={(e) => setField(key, e.target.value)}
            />
            <span className="mt-0.5 block text-[10px] font-normal text-slate-400">{hint}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

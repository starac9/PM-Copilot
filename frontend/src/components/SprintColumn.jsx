// One sprint column on the roadmap view. Shows the sprint number, its total effort vs.
// capacity, and the stories assigned to it (already ranked + priority-tagged by the
// backend's deterministic roadmap logic).
const PRIORITY_STYLES = {
  Highest: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  High: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
  Medium: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  Low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  Lowest: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export default function SprintColumn({ sprint, capacity }) {
  const fill = Math.min(100, (sprint.total_effort / capacity) * 100);

  return (
    <div className="card flex w-72 shrink-0 flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold text-heading">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-grass-400 text-xs font-bold text-ink">
            {sprint.number}
          </span>
          Sprint {sprint.number}
        </h3>
        <span className="text-xs font-medium text-slate-400">
          {sprint.total_effort}/{capacity} pts
        </span>
      </div>

      {/* Capacity fill bar. */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-grass-400" style={{ width: `${fill}%` }} />
      </div>

      <div className="space-y-2">
        {sprint.stories.map((story, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-800/50"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span
                className={`badge ${
                  PRIORITY_STYLES[story.priority] || "bg-slate-100 text-slate-600"
                }`}
              >
                {story.priority}
              </span>
              <span className="text-[10px] text-slate-400">{story.effort} pts</span>
            </div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{story.title}</p>
            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
              {story.epic} · RICE {story.rice_score.toFixed(0)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

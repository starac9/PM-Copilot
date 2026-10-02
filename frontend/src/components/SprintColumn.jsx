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
  // A single story bigger than the whole capacity gets its own sprint; flag it.
  const over = sprint.total_effort > capacity;

  return (
    <div className="card flex w-72 shrink-0 flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2.5 font-semibold text-heading">
          <span className="logo-mark h-7 w-7 font-mono text-xs font-bold">
            {String(sprint.number).padStart(2, "0")}
          </span>
          Sprint {sprint.number}
        </h3>
        <span
          className={`font-mono text-[11px] ${over ? "text-orange-600 dark:text-orange-400" : "text-slate-400"}`}
        >
          {Number(sprint.total_effort.toFixed(1))}/{capacity} pts
        </span>
      </div>

      {/* Capacity fill bar. */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full ${over ? "bg-orange-400" : "bg-grass-400"}`}
          style={{ width: `${fill}%` }}
        />
      </div>

      <div className="space-y-2">
        {sprint.stories.map((story, i) => (
          <div
            key={i}
            className="rounded-lg border border-slate-200 bg-[#FAFAF7] p-3 dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className={`badge ${PRIORITY_STYLES[story.priority] || PRIORITY_STYLES.Low}`}>
                {story.priority}
              </span>
              <span className="font-mono text-[10px] text-slate-400">{story.effort} pts</span>
            </div>
            <p className="text-sm font-medium text-heading">{story.title}</p>
            <p className="mt-1 truncate font-mono text-[10px] text-slate-400 dark:text-slate-500">
              {story.epic} · RICE {story.rice_score.toFixed(story.rice_score < 10 ? 1 : 0)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

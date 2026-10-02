// A friendly placeholder shown when there's no data yet (e.g. no projects, no PRD).
// Good empty states guide the user to their next action instead of showing a blank page.
// Styled as a dashed "schematic" frame over the blueprint grid, like the landing mockups.
// `icon` is a lucide icon component (defaults to Sparkles).
import { Sparkles } from "lucide-react";

export default function EmptyState({ title, description, action, icon: Icon = Sparkles }) {
  return (
    <div className="card-dashed bg-grid animate-fade-in-up flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="logo-mark h-12 w-12 shadow-[0_10px_30px_-12px_rgba(115,194,47,0.6)]">
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <h3 className="mt-1 text-lg font-semibold text-heading">{title}</h3>
      {description && <p className="max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

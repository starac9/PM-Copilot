// A friendly placeholder shown when there's no data yet (e.g. no projects, no PRD).
// Good empty states guide the user to their next action instead of showing a blank page.
// `icon` is a lucide icon component (defaults to Sparkles).
import { Sparkles } from "lucide-react";

export default function EmptyState({ title, description, action, icon: Icon = Sparkles }) {
  return (
    <div className="card animate-fade-in-up flex flex-col items-center justify-center gap-3 p-12 text-center">
      <div className="logo-mark h-14 w-14">
        <Icon size={24} strokeWidth={1.75} />
      </div>
      <h3 className="text-lg font-semibold text-heading">{title}</h3>
      {description && <p className="max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

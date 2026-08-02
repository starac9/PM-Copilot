// A small sub-navigation shared by the project pages, so the user can move between the
// PRD, Stories, Roadmap, and Workspace for one project. NavLink auto-applies an "active"
// style to the current tab, so we don't have to track it ourselves.
import { NavLink } from "react-router-dom";
import { Compass, FileText, ListChecks, Route } from "lucide-react";

const TABS = [
  { to: "", label: "PRD", icon: FileText, end: true },
  { to: "stories", label: "Stories", icon: ListChecks },
  { to: "roadmap", label: "Roadmap", icon: Route },
  { to: "workspace", label: "Workspace", icon: Compass },
];

export default function ProjectTabs({ projectId }) {
  return (
    <nav className="inline-flex gap-1 rounded-2xl border border-slate-200/70 bg-white/80 p-1 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={label}
          end={end}
          to={`/projects/${projectId}${to ? `/${to}` : ""}`}
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-grass-400 text-ink shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            }`
          }
        >
          <Icon size={16} strokeWidth={1.75} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

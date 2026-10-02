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
    // Scrolls horizontally on narrow screens instead of wrapping into a ragged second row.
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <nav className="inline-flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {TABS.map(({ to, label, icon: Icon, end }, i) => (
          <NavLink
            key={label}
            end={end}
            to={`/projects/${projectId}${to ? `/${to}` : ""}`}
            className={({ isActive }) =>
              `flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-grass-400 text-ink shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`font-mono text-[10px] ${isActive ? "text-ink/60" : "text-slate-300 dark:text-slate-600"}`}
                >
                  0{i + 1}
                </span>
                <Icon size={15} strokeWidth={1.9} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

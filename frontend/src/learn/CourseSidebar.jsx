// The course table of contents (GfG-style): every module with its lessons, completion ticks,
// and the current lesson highlighted. Sticky beside the lesson on desktop; on mobile it
// lives in a collapsible "Course contents" panel above the article.
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { CheckCircle2, ChevronDown, Circle } from "lucide-react";

import { LESSONS, MODULES } from "./curriculum.js";
import { useLearnProgress } from "./useLearnProgress.js";

function Contents({ onNavigate }) {
  const { done } = useLearnProgress();
  return (
    <div className="space-y-5">
      {MODULES.map((module, mi) => (
        <div key={module.id}>
          <p className="eyebrow mb-2 flex items-center gap-1.5 !tracking-[0.15em]">
            <span className="text-grass-500">{String(mi + 1).padStart(2, "0")}</span>
            {module.title}
          </p>
          <ul className="space-y-0.5">
            {module.lessons.map((lesson) => {
              const complete = done.has(lesson.slug);
              return (
                <li key={lesson.slug}>
                  <NavLink
                    to={`/learn/${lesson.slug}`}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-sm transition ${
                        isActive
                          ? "bg-grass-100 font-medium text-ink dark:bg-grass-500/10 dark:text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                      }`
                    }
                  >
                    {complete ? (
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-grass-500" />
                    ) : (
                      <Circle size={15} className="mt-0.5 shrink-0 text-slate-300 dark:text-slate-600" />
                    )}
                    <span>{lesson.title}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function CourseProgress() {
  const { done } = useLearnProgress();
  const count = LESSONS.filter((l) => done.has(l.slug)).length;
  const pct = Math.round((count / LESSONS.length) * 100);
  return (
    <div>
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-slate-400">
        <span>Progress</span>
        <span>
          {count}/{LESSONS.length} · {pct}%
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full rounded-full bg-grass-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function CourseSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] space-y-5 overflow-y-auto pb-8 pr-2">
          <Link to="/learn" className="block text-sm font-semibold text-heading hover:text-grass-600">
            Product Management, from scratch
          </Link>
          <CourseProgress />
          <div className="rule pt-5">
            <Contents />
          </div>
        </div>
      </aside>

      {/* Mobile */}
      <div className="card lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-heading"
        >
          Course contents
          <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="space-y-4 border-t border-dashed border-slate-200 px-4 py-4 dark:border-slate-800">
            <CourseProgress />
            <Contents onNavigate={() => setOpen(false)} />
          </div>
        )}
      </div>
    </>
  );
}

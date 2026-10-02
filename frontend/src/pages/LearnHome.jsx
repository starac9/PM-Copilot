// /learn — the course overview: what you'll learn, your progress, and every module with its
// lessons. Public, so visitors can start learning before signing up.
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock, GraduationCap, Layers, Sparkles } from "lucide-react";

import { Eyebrow } from "../components/PageHeader.jsx";
import SiteLayout from "../components/SiteLayout.jsx";
import { CourseProgress } from "../learn/CourseSidebar.jsx";
import { LESSONS, MODULES, TOTAL_MINUTES } from "../learn/curriculum.js";
import { MODULE_ICONS } from "../learn/icons.js";
import { useLearnProgress } from "../learn/useLearnProgress.js";

export default function LearnHome() {
  const { done } = useLearnProgress();
  const nextLesson = LESSONS.find((l) => !done.has(l.slug)) ?? LESSONS[0];
  const started = done.size > 0;

  return (
    <SiteLayout>
      <div className="space-y-12">
        {/* Hero */}
        <section className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-end">
          <div>
            <Eyebrow>Learn product management</Eyebrow>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl">
              Product management,{" "}
              <span className="whitespace-nowrap rounded-[3px] bg-grass-400 px-2 text-ink">from scratch</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              A step-by-step course from “what does a PM do?” to roadmaps, metrics, and interviews.
              Every lesson links to hands-on practice in the workspace — and PM AI is one click away
              when you get stuck.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to={`/learn/${nextLesson.slug}`} className="btn-primary">
                {started ? "Continue learning" : "Start lesson 1.1"} <ArrowRight size={16} />
              </Link>
              <Link to="/ask" className="btn-secondary">
                <Sparkles size={15} className="text-grass-500" /> Ask PM AI
              </Link>
            </div>
          </div>

          <div className="card space-y-4 p-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: Layers, value: MODULES.length, label: "Modules" },
                { icon: GraduationCap, value: LESSONS.length, label: "Lessons" },
                { icon: Clock, value: `${Math.round(TOTAL_MINUTES / 60 * 10) / 10}h`, label: "Reading" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label}>
                  <Icon size={16} className="mx-auto text-grass-500" />
                  <div className="mt-1.5 text-xl font-semibold text-heading">{value}</div>
                  <div className="eyebrow !tracking-wider">{label}</div>
                </div>
              ))}
            </div>
            <div className="rule pt-4">
              <CourseProgress />
            </div>
            {started && (
              <p className="text-xs text-muted">
                Up next: <span className="font-medium text-heading">{nextLesson.number} {nextLesson.title}</span>
              </p>
            )}
          </div>
        </section>

        {/* Modules */}
        <section className="space-y-5">
          <div className="rule pt-8">
            <Eyebrow>Curriculum</Eyebrow>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {MODULES.map((module, mi) => {
              const Icon = MODULE_ICONS[module.icon];
              const completed = module.lessons.filter((l) => done.has(l.slug)).length;
              const finished = completed === module.lessons.length;
              return (
                <div key={module.id} className="card flex flex-col p-5">
                  <div className="flex items-start gap-4">
                    <span className="logo-mark h-11 w-11">
                      <Icon size={19} strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                          Module {String(mi + 1).padStart(2, "0")}
                        </span>
                        <span className={`badge ${finished ? "badge-success" : "badge-neutral"} font-mono`}>
                          {finished && <CheckCircle2 size={12} />}
                          {completed}/{module.lessons.length}
                        </span>
                      </div>
                      <h2 className="mt-1 text-lg font-semibold tracking-tight text-heading">{module.title}</h2>
                      <p className="mt-1 text-sm text-muted">{module.description}</p>
                    </div>
                  </div>
                  <ol className="rule mt-4 space-y-0.5 pt-3">
                    {module.lessons.map((lesson, li) => (
                      <li key={lesson.slug}>
                        <Link
                          to={`/learn/${lesson.slug}`}
                          className="group flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        >
                          <span className="w-7 shrink-0 font-mono text-[11px] text-slate-400">
                            {mi + 1}.{li + 1}
                          </span>
                          <span
                            className={`flex-1 ${done.has(lesson.slug) ? "text-muted line-through decoration-slate-300 dark:decoration-slate-600" : "text-body group-hover:text-heading"}`}
                          >
                            {lesson.title}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">{lesson.minutes} min</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

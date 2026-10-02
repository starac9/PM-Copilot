// /learn/:slug — one lesson: course sidebar, the article, a hands-on practice link into the
// workspace, "ask PM AI about this lesson" prompts, mark-complete, and prev/next navigation.
import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Clock, Hammer, MessageCircleQuestion, Sparkles } from "lucide-react";

import Button from "../components/Button.jsx";
import Markdown from "../components/Markdown.jsx";
import SiteLayout from "../components/SiteLayout.jsx";
import CourseSidebar from "../learn/CourseSidebar.jsx";
import { findLesson } from "../learn/curriculum.js";
import { useLearnProgress } from "../learn/useLearnProgress.js";

// Link to the PM AI Chat with a question pre-filled and the lesson passed as context.
const askUrl = (question, topic) =>
  `/ask?${new URLSearchParams({ q: question, topic }).toString()}`;

function PrevNext({ lesson, direction }) {
  if (!lesson) return <div />;
  const next = direction === "next";
  return (
    <Link
      to={`/learn/${lesson.slug}`}
      className={`card card-hover group flex flex-col gap-1 p-4 ${next ? "text-right" : ""}`}
    >
      <span className={`eyebrow flex items-center gap-1.5 ${next ? "justify-end" : ""}`}>
        {!next && <ArrowLeft size={12} />} {next ? "Next" : "Previous"} {next && <ArrowRight size={12} />}
      </span>
      <span className="font-semibold text-heading group-hover:text-grass-700 dark:group-hover:text-grass-400">
        {lesson.number} {lesson.title}
      </span>
    </Link>
  );
}

export default function LessonView() {
  const { slug } = useParams();
  const found = findLesson(slug);
  const { done, setComplete } = useLearnProgress();

  // Start each lesson at the top (navigation keeps the previous scroll position otherwise).
  // Block body on purpose: newer browsers return a Promise from scrollTo, and an effect must
  // return nothing or a cleanup function.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!found) return <Navigate to="/learn" replace />;
  const { lesson, prev, next } = found;
  const complete = done.has(lesson.slug);

  return (
    <SiteLayout>
      <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] xl:gap-12">
        <CourseSidebar />

        <article className="min-w-0 space-y-8">
          <header>
            <p className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-slate-400">
              <Link to="/learn" className="hover:text-grass-600">Learn</Link>
              <span>/</span>
              <span>
                Module {lesson.moduleNumber} · {lesson.moduleTitle}
              </span>
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
              <span className="mr-2 font-mono text-xl text-grass-500 sm:text-2xl">{lesson.number}</span>
              {lesson.title}
            </h1>
            <p className="mt-3 text-lg text-muted">{lesson.summary}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="badge badge-neutral font-mono">
                <Clock size={12} /> {lesson.minutes} min read
              </span>
              {complete && (
                <span className="badge badge-success">
                  <Check size={12} /> Completed
                </span>
              )}
            </div>
          </header>

          <div className="card px-5 py-6 sm:px-8 sm:py-8">
            <Markdown>{lesson.body}</Markdown>
          </div>

          {/* Practice + Ask AI */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card-dashed bg-grid flex flex-col gap-3 p-5">
              <span className="eyebrow flex items-center gap-1.5">
                <Hammer size={12} className="text-grass-500" /> Practice it
              </span>
              <p className="text-sm text-body">Apply this lesson to a real product idea.</p>
              <Link to={lesson.practice.to} className="btn-primary mt-auto self-start !py-2">
                {lesson.practice.label} <ArrowRight size={15} />
              </Link>
            </div>
            <div className="card flex flex-col gap-3 p-5">
              <span className="eyebrow flex items-center gap-1.5">
                <MessageCircleQuestion size={12} className="text-grass-500" /> Ask PM AI
              </span>
              <div className="flex flex-col gap-2">
                {lesson.ask.map((q) => (
                  <Link
                    key={q}
                    to={askUrl(q, lesson.title)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-body transition hover:border-grass-400 hover:text-heading dark:border-slate-700"
                  >
                    <Sparkles size={13} className="shrink-0 text-grass-500" />
                    {q}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rule pt-6">
            <p className="text-sm text-muted">
              {complete ? "Nice work — this lesson is marked complete." : "Finished reading?"}
            </p>
            <Button
              variant={complete ? "secondary" : "primary"}
              onClick={() => setComplete(lesson.slug, !complete)}
            >
              <Check size={15} /> {complete ? "Mark as not done" : "Mark as complete"}
            </Button>
          </div>

          <nav className="grid gap-4 sm:grid-cols-2" aria-label="Lesson navigation">
            <PrevNext lesson={prev} direction="prev" />
            <PrevNext lesson={next} direction="next" />
          </nav>
        </article>
      </div>
    </SiteLayout>
  );
}

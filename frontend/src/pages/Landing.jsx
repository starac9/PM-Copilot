// The public marketing landing page (route "/"). Design language: a clean, technical
// "blueprint" — near-white canvas, dashed hairline dividers, monospace labels, a single
// vivid grass-green accent, and product mockups framed like schematics. Fully theme-aware.
import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Check,
  ChevronRight,
  Compass,
  Cpu,
  FileText,
  GraduationCap,
  ListChecks,
  MessageSquareText,
  Rocket,
  Route,
  ScanSearch,
  Share2,
  Sparkles,
  Target,
} from "lucide-react";

import Logo from "../components/Logo.jsx";
import SiteNav from "../components/SiteNav.jsx";
import Wordmark from "../components/Wordmark.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { LESSONS, MODULES } from "../learn/curriculum.js";

// Lazy-loaded so its markdown renderer is fetched only when the widget mounts.
const ChatWidget = lazy(() => import("../components/ChatWidget.jsx"));

const CAPABILITIES = [
  { icon: Compass, title: "Strategy & discovery", sub: "vision · market · hypotheses" },
  { icon: FileText, title: "PRDs", sub: "problem · personas · scope" },
  { icon: ListChecks, title: "User stories", sub: "epics + acceptance criteria" },
  { icon: Target, title: "RICE scoring", sub: "reach · impact · conf · effort" },
  { icon: Route, title: "Sprint roadmap", sub: "capacity-aware planning" },
  { icon: Rocket, title: "Go-to-market", sub: "positioning · channels · launch" },
  { icon: ScanSearch, title: "RAG grounding", sub: "your PDFs & specs" },
  { icon: Share2, title: "Export", sub: "jira csv · markdown" },
];

const STACK = ["Jira", "Linear", "Notion", "Confluence", "GitHub", "Figma", "Slack", "Trello"];

const BADGES = ["Free to use", "No credit card", "Exports to Jira", "Grounded in your docs"];

// ── Small shared pieces ──────────────────────────────────────────────────────

// A monospace, dash-prefixed section eyebrow: "— WORKFLOW".
function Eyebrow({ children, className = "" }) {
  return (
    <p className={`font-mono text-xs uppercase tracking-[0.2em] text-slate-400 ${className}`}>
      <span className="text-grass-500">— </span>
      {children}
    </p>
  );
}

// The green primary CTA, as a router Link.
function GreenLink({ to, children, className = "" }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1 rounded-lg bg-grass-400 px-5 py-2.5 text-sm font-semibold text-ink shadow-[0_1px_0_rgba(0,0,0,0.04)] transition hover:bg-grass-500 ${className}`}
    >
      {children}
      <ChevronRight size={16} strokeWidth={2.5} />
    </Link>
  );
}

// A seamless left-scrolling marquee (track duplicated so -50% loops cleanly). Pauses on hover.
function Marquee({ children, className = "", speed = "animate-marquee" }) {
  return (
    <div className="group overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)]">
      <div className={`flex w-max ${speed} group-hover:[animation-play-state:paused] ${className}`}>
        {children}
        {children}
      </div>
    </div>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAFAF7] font-sans text-ink dark:bg-[#0a0d14] dark:text-slate-100">
      {/* ── Nav (shared platform nav: Workspace · Learn · PM AI Chat) ─────── */}
      <SiteNav wide />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="border-b border-dashed border-slate-200 dark:border-slate-800">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
          {/* Left: message */}
          <div className="flex flex-col justify-center px-6 py-16 lg:py-24">
            <Eyebrow>The all-in-one product management platform</Eyebrow>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-tight text-ink dark:text-white sm:text-6xl">
              Work as a PM.
              <br />
              Learn the craft.
              <br />
              <span className="box-decoration-clone rounded-[3px] bg-grass-400 px-2.5 pb-1 text-ink">
                Ask the AI.
              </span>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-slate-500 dark:text-slate-400">
              One place to do the job, learn it from scratch, and get answers on demand: an AI
              workspace that writes PRDs, backlogs, and roadmaps; a step-by-step PM course; and a
              PM mentor you can ask anything.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <GreenLink to={isAuthenticated ? "/dashboard" : "/register"}>
                {isAuthenticated ? "Open workspace" : "Start building"}
              </GreenLink>
              <Link
                to="/learn"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
              >
                <GraduationCap size={16} /> Start learning
              </Link>
              <Link
                to="/ask"
                className="inline-flex items-center gap-2 px-2 py-2.5 text-sm font-semibold text-slate-600 transition hover:text-ink dark:text-slate-300 dark:hover:text-white"
              >
                <Sparkles size={15} className="text-grass-500" /> Ask PM AI
              </Link>
            </div>
          </div>

          {/* Right: live-generation mockup, in a dashed schematic frame */}
          <div className="flex items-center border-t border-dashed border-slate-200 p-6 dark:border-slate-800 lg:border-l lg:border-t-0 lg:p-10">
            <HeroMock />
          </div>
        </div>
      </section>

      {/* ── Three pillars: Work · Learn · Ask ─────────────────────────────── */}
      <Pillars />

      {/* ── Stack marquee ────────────────────────────────────────────────── */}
      <section className="border-b border-dashed border-slate-200 py-10 dark:border-slate-800">
        <p className="mb-7 text-center font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
          Plugs into the tools you already use
        </p>
        <Marquee>
          {STACK.map((name, i) => (
            <span key={i} className="px-8 text-2xl font-semibold text-slate-300 dark:text-slate-700">
              {name}
            </span>
          ))}
        </Marquee>
      </section>

      {/* ── Capabilities (heading + card marquee) ────────────────────────── */}
      <section id="capabilities" className="border-b border-dashed border-slate-200 py-20 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <Eyebrow className="!text-slate-400">Capabilities</Eyebrow>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink dark:text-white sm:text-4xl">
            One copilot, the whole PM workflow
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-slate-400">
            From the first sentence to a ready-to-ship sprint plan — evaluated end to end.
          </p>
        </div>
        <CapabilityGrid />
      </section>

      {/* ── Workflow: two split rows (text left, mockup right) ────────────── */}
      <section id="workflow">
        <SplitRow
          eyebrow="Step 01"
          title="Describe your product in plain English."
          text="One line is enough. PM Copilot analyzes the idea and drafts a structured PRD, a prioritized backlog, and the epics that hold it together."
          mock={<AgentMock />}
        />
        <SplitRow
          reverse
          eyebrow="Step 02"
          title="From idea to sprint plan in minutes."
          text="RICE scores recompute live as you tune reach, impact, confidence, and effort. Set a capacity and get a deterministic, explainable roadmap."
          mock={<PipelineMock />}
        />
      </section>

      {/* ── Big CTA ──────────────────────────────────────────────────────── */}
      <section id="start" className="border-y border-dashed border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight text-ink dark:text-white sm:text-5xl">
            Ship your first PRD
            <br />
            in under 5 minutes
          </h2>
          <div className="mt-9 flex justify-center">
            <GreenLink to="/register" className="px-6 py-3 text-base">
              Start building for free
            </GreenLink>
          </div>
        </div>
      </section>

      {/* ── Trust badges (dashed dividers) ───────────────────────────────── */}
      <section className="border-b border-dashed border-slate-200 dark:border-slate-800">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-dashed divide-slate-200 dark:divide-slate-800 sm:grid-cols-4">
          {BADGES.map((b) => (
            <div key={b} className="flex items-center justify-center gap-2 px-4 py-5 text-center">
              <Check size={15} className="shrink-0 text-grass-500" strokeWidth={3} />
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {b}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <Wordmark />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              The all-in-one PM platform: an AI workspace for PRDs, backlogs, and roadmaps, a
              course to learn product management from scratch, and a PM mentor on call.
            </p>
            <div className="mt-6">
              <GreenLink to="/register">Start building</GreenLink>
            </div>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">Navigate</p>
            <Link to="/dashboard" className="text-sm text-slate-500 transition hover:text-ink dark:hover:text-white">Workspace</Link>
            <Link to="/learn" className="text-sm text-slate-500 transition hover:text-ink dark:hover:text-white">Learn product management</Link>
            <Link to="/ask" className="text-sm text-slate-500 transition hover:text-ink dark:hover:text-white">PM AI Chat</Link>
            <a href="#capabilities" className="text-sm text-slate-500 transition hover:text-ink dark:hover:text-white">Features</a>
            <Link to="/login" className="text-sm text-slate-500 transition hover:text-ink dark:hover:text-white">Sign in</Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-dashed border-slate-200 pt-6 dark:border-slate-800 sm:flex-row">
          <span className="font-mono text-xs text-slate-400">© 2026 PM Copilot · A portfolio project</span>
          <span className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-grass-400" />
            All systems operational
          </span>
        </div>
      </footer>

      {/* Floating Groq-powered FAQ assistant (lazy-loaded). */}
      <Suspense fallback={null}>
        <ChatWidget />
      </Suspense>
    </div>
  );
}

// ── Section building blocks ──────────────────────────────────────────────────

// The three ways into the platform, each a card with a tiny live-looking preview.
function Pillars() {
  const pillars = [
    {
      n: "01",
      tag: "Work",
      icon: Cpu,
      title: "AI PM workspace",
      text: "Turn an idea into a PRD, RICE-scored user stories, a sprint roadmap, and 8 more PM artifacts — grounded in your docs.",
      to: "/dashboard",
      cta: "Open the workspace",
      preview: (
        <div className="space-y-1.5 font-mono text-[11px]">
          {[
            ["PRD", "5 sections", true],
            ["Backlog", "12 stories", true],
            ["Roadmap", "3 sprints", false],
          ].map(([k, v, ok]) => (
            <div key={k} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-950">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-grass-500" : "animate-pulse bg-slate-300 dark:bg-slate-600"}`} />
                {k}
              </span>
              <span className="text-slate-400">{v}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      n: "02",
      tag: "Learn",
      icon: GraduationCap,
      title: "Learn PM from scratch",
      text: `A step-by-step course — ${MODULES.length} modules, ${LESSONS.length} lessons — from the basics to roadmaps, metrics, and interviews, with hands-on practice.`,
      to: "/learn",
      cta: "Start the course",
      preview: (
        <div className="space-y-1.5 font-mono text-[11px]">
          {LESSONS.slice(0, 3).map((l, i) => (
            <div key={l.slug} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-950">
              <span className="text-grass-600 dark:text-grass-400">{l.number}</span>
              <span className="truncate text-slate-600 dark:text-slate-300">{l.title}</span>
              {i === 0 && <Check size={12} className="ml-auto shrink-0 text-grass-500" />}
            </div>
          ))}
        </div>
      ),
    },
    {
      n: "03",
      tag: "Ask",
      icon: MessageSquareText,
      title: "PM AI Chat",
      text: "An always-on PM mentor. Ask about frameworks, metrics, interviews, or your own product — get structured answers with real examples.",
      to: "/ask",
      cta: "Ask a question",
      preview: (
        <div className="space-y-1.5 text-[12px]">
          <div className="ml-auto w-fit rounded-lg rounded-br-sm bg-ink px-2.5 py-1.5 text-white dark:bg-slate-800">
            RICE or MoSCoW?
          </div>
          <div className="w-fit max-w-[90%] rounded-lg rounded-bl-sm border border-grass-300 bg-grass-50 px-2.5 py-1.5 text-ink dark:border-grass-700/50 dark:bg-grass-700/10 dark:text-slate-200">
            Use <b>RICE</b> to rank a backlog, <b>MoSCoW</b> to agree MVP scope…
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="border-b border-dashed border-slate-200 py-20 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <Eyebrow>Three ways in</Eyebrow>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink dark:text-white sm:text-4xl">
            Do the work, learn the craft, ask the expert
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-slate-400">
            Everything a product manager needs — whether you&apos;re shipping today or just getting started.
          </p>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {pillars.map(({ n, tag, icon: Icon, title, text, to, cta, preview }) => (
            <Link
              key={n}
              to={to}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-grass-400 hover:shadow-[0_24px_60px_-30px_rgba(115,194,47,0.55)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-grass-600"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink text-grass-400 transition group-hover:bg-grass-400 group-hover:text-ink dark:bg-slate-950">
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  {n} / {tag}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-ink dark:text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
              <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-[#FAFAF7] p-3 dark:border-slate-700 dark:bg-slate-950/60" style={GRID_BG}>
                {preview}
              </div>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-ink transition group-hover:gap-2 dark:text-white">
                {cta} <ChevronRight size={16} className="text-grass-500" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// The capabilities grid, with a live highlight that steps through the PM workflow — as if
// the copilot is working each stage in turn. This gives the section genuine, PM-relevant
// motion (not just a scroll) and reads end-to-end, left to right.
function CapabilityGrid() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % CAPABILITIES.length), 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto mt-12 grid max-w-7xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4">
      {CAPABILITIES.map(({ icon: Icon, title, sub }, i) => {
        const on = i === active;
        return (
          <div
            key={i}
            className={`flex items-center gap-4 rounded-xl border px-5 py-4 transition-all duration-500 ${
              on
                ? "border-grass-400 bg-grass-50 shadow-[0_10px_30px_-18px_rgba(115,194,47,0.9)] dark:border-grass-600 dark:bg-grass-700/10"
                : "border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors duration-500 ${
                on
                  ? "border-grass-400 bg-grass-400 text-ink"
                  : "border-slate-200 bg-[#FAFAF7] text-ink dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              }`}
            >
              <Icon size={18} strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="font-semibold text-ink dark:text-white">{title}</span>
                {on && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-grass-500" />}
              </span>
              <span className="block font-mono text-[11px] text-slate-400">{sub}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// An alternating text/mockup row. Whichever block comes SECOND in DOM order carries the
// dashed divider (a top border when stacked on mobile, a left border side-by-side on desktop),
// so the seam always falls between the two blocks regardless of `reverse`.
function SplitRow({ eyebrow, title, text, mock, reverse = false }) {
  const divider =
    "border-t border-dashed border-slate-200 dark:border-slate-800 lg:border-t-0 lg:border-l lg:border-dashed";

  const textBlock = (second) => (
    <div className={`flex min-w-0 flex-col justify-center px-6 py-16 lg:py-20 ${second ? divider : ""}`}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h3 className="mt-5 max-w-md text-3xl font-semibold leading-tight tracking-tight text-ink dark:text-white sm:text-4xl">
        {title}
      </h3>
      <p className="mt-4 max-w-md text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );

  const mockBlock = (second) => (
    <div className={`flex min-w-0 items-center p-4 sm:p-6 lg:p-12 ${second ? divider : ""}`}>{mock}</div>
  );

  return (
    <div className="border-b border-dashed border-slate-200 dark:border-slate-800">
      <div className="mx-auto grid max-w-7xl items-stretch lg:grid-cols-2">
        {reverse ? (
          <>
            {mockBlock(false)}
            {textBlock(true)}
          </>
        ) : (
          <>
            {textBlock(false)}
            {mockBlock(true)}
          </>
        )}
      </div>
    </div>
  );
}

// ── Mockups (all built from divs — no images, theme-aware) ───────────────────

// A faint blueprint grid used as the backdrop inside mock frames.
const GRID_BG = {
  backgroundImage:
    "linear-gradient(rgb(100 116 139 / 0.06) 1px, transparent 1px), linear-gradient(90deg, rgb(100 116 139 / 0.06) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
};

// Hero: a genuinely LIVE generation stream. It cycles through example ideas, streaming each
// copilot response character-by-character (a typewriter effect) while the equalizer pulses —
// so the panel reads as a real, working demo rather than a frozen screenshot.
// Each demo streams a DIFFERENT PM artifact the copilot produces, so the panel shows the
// end-to-end breadth (PRD → prioritization → metrics → planning → launch), not just one trick.
const HERO_DEMOS = [
  {
    kind: "PRD",
    prompt: "A focus timer for remote engineering teams",
    output: "# Problem — remote teams lack shared focus rituals, so deep work stays fragmented and hard to protect.",
  },
  {
    kind: "RICE",
    prompt: "Prioritize: in-app onboarding checklist",
    output: "RICE 8.4  ·  reach 1,200  ·  impact 3  ·  confidence 80%  ·  effort 5",
  },
  {
    kind: "OKR",
    prompt: "Draft a Q3 objective for activation",
    output: "Objective — new users reach value in their first session.\nKR1 — activation rate 38% → 55%.",
  },
  {
    kind: "Roadmap",
    prompt: "Plan sprints at 8 points of capacity",
    output: "Sprint 1 — Auth, Onboarding  (8 pts)\nSprint 2 — Timer, Presence  (7 pts)",
  },
  {
    kind: "Go-to-market",
    prompt: "Draft a launch plan for the beta",
    output: "Channel — developer communities.  Message — “focus, together.”  Beachhead — remote eng teams.",
  },
];

function HeroMock() {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const demo = HERO_DEMOS[index];
  const done = typed.length >= demo.output.length;

  // Stream the current demo's output, then pause and advance to the next one.
  useEffect(() => {
    setTyped("");
    let char = 0;
    const type = setInterval(() => {
      char += 1;
      setTyped(demo.output.slice(0, char));
      if (char >= demo.output.length) clearInterval(type);
    }, 24);
    const advance = setTimeout(
      () => setIndex((n) => (n + 1) % HERO_DEMOS.length),
      demo.output.length * 24 + 2600
    );
    return () => {
      clearInterval(type);
      clearTimeout(advance);
    };
  }, [index, demo.output]);

  return (
    <div
      className="w-full overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-900"
      style={GRID_BG}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between border-b border-dashed border-slate-200 px-5 py-3 dark:border-slate-800">
        <span className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink dark:text-white">
          <span className="h-2 w-2 animate-pulse rounded-full bg-grass-500" />
          Live generation
        </span>
        <span className="rounded border border-slate-200 bg-[#FAFAF7] px-2 py-0.5 font-mono text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-950">
          1,240 tok/s
        </span>
      </div>

      {/* Equalizer — quieter once a response has finished streaming. */}
      <div className={`flex h-16 items-end justify-center gap-1 px-5 py-4 transition-opacity ${done ? "opacity-40" : "opacity-100"}`}>
        {Array.from({ length: 32 }).map((_, i) => (
          <span
            key={i}
            className="w-1 origin-bottom rounded-full bg-grass-400"
            style={{
              height: `${20 + ((i * 7) % 40)}%`,
              animation: `equalize ${0.8 + ((i % 5) * 0.18)}s ease-in-out ${i * 0.04}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Prompt + streaming copilot response */}
      <div className="space-y-4 px-5 pb-6">
        <div>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">Prompt</div>
          <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-[12.5px] text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            {demo.prompt}
          </div>
        </div>
        <div className="text-right">
          <div className="mb-1.5 flex items-center justify-end gap-1.5 font-mono text-[10px] uppercase tracking-wider text-grass-600">
            {!done && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-grass-500" />}
            Copilot · {demo.kind}
          </div>
          <div className="inline-block min-h-[3.5rem] whitespace-pre-line rounded-lg border border-grass-300 bg-grass-50 px-3.5 py-2.5 text-left font-mono text-[12.5px] leading-relaxed text-ink dark:border-grass-700/50 dark:bg-grass-700/10 dark:text-slate-200">
            {typed}
            {!done && <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-grass-500" />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Workflow step 1: an "agent" card that has drafted the plan.
function AgentMock() {
  const rows = [
    { label: "Problem & personas", value: "5 sections" },
    { label: "Backlog", value: "12 user stories" },
    { label: "Roadmap", value: "3 sprints" },
  ];
  return (
    <div className="w-full rounded-xl border border-dashed border-slate-300 bg-white p-5 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-grass-400 text-ink">
            <Logo size={16} />
          </span>
          <span className="font-semibold text-ink dark:text-white">PM Copilot</span>
        </span>
        <span className="rounded-full bg-grass-100 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-grass-700 dark:bg-grass-700/20 dark:text-grass-300">
          Ready
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        I analyzed your idea — <span className="font-semibold text-ink dark:text-white">FocusFlow</span>.
        Generated a plan focused on:
      </p>

      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between rounded-lg border border-slate-100 bg-[#FAFAF7] px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950">
            <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-grass-400" />
              {r.label}
            </span>
            <span className="font-mono text-xs text-slate-400">{r.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        <button className="rounded-lg bg-grass-400 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-grass-500">
          Approve plan
        </button>
        <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-[#FAFAF7] dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
          Regenerate
        </button>
      </div>
    </div>
  );
}

// Workflow step 2: a three-stage pipeline flow diagram.
function PipelineMock() {
  const stages = [
    { icon: FileText, title: "Your idea", sub: "one line", active: false },
    { icon: Cpu, title: "PM Copilot", sub: "generate", active: true },
    { icon: BarChart3, title: "Ship plan", sub: "prd · backlog · roadmap", active: false },
  ];
  return (
    <div className="w-full rounded-xl border border-dashed border-slate-300 bg-white p-4 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-900 sm:p-6" style={GRID_BG}>
      <p className="mb-5 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-grass-600">
        Grounded in your docs
      </p>
      <div className="flex items-stretch justify-between gap-1 sm:gap-2">
        {stages.map(({ icon: Icon, title, sub, active }, i) => (
          <div key={i} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
            <div
              className={`min-w-0 flex-1 rounded-xl border px-1.5 py-3 text-center sm:p-4 ${
                active
                  ? "border-grass-400 bg-grass-50 dark:border-grass-600 dark:bg-grass-700/10"
                  : "border-slate-200 bg-[#FAFAF7] dark:border-slate-800 dark:bg-slate-950"
              }`}
            >
              <span
                className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg ${
                  active ? "bg-grass-400 text-ink" : "border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900"
                }`}
              >
                <Icon size={17} strokeWidth={1.75} />
              </span>
              <div className="mt-2.5 text-[13px] font-semibold leading-tight text-ink dark:text-white sm:text-sm">{title}</div>
              <div className="mt-0.5 break-words font-mono text-[10px] leading-snug text-slate-400">{sub}</div>
            </div>
            {i < stages.length - 1 && <ChevronRight size={14} className="shrink-0 text-slate-300 dark:text-slate-600" />}
          </div>
        ))}
      </div>
    </div>
  );
}

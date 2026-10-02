// Shared UI + logic for both Login and Register, since they're nearly identical (email +
// password). The parent passes a `title`, the `onSubmit` handler, and the link to the
// other page. This keeps Login.jsx and Register.jsx tiny (DRY).
//
// Layout: a two-column "product" splash — a branded gradient panel on the left (hidden on
// mobile) and the auth card on the right — the kind of first impression a polished SaaS
// gives.
//
// Form state + validation are handled by react-hook-form with a Zod resolver, so the email/
// password rules live in one schema and errors render per-field.
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { FileText, Route, ScanSearch, Target } from "lucide-react";

import { credentialsSchema } from "../lib/schemas.js";
import Button from "./Button.jsx";
import GoogleSignInButton from "./GoogleSignInButton.jsx";
import Logo from "./Logo.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import Wordmark from "./Wordmark.jsx";

const FEATURES = [
  { Icon: FileText, title: "Structured PRDs", text: "Turn a one-line idea into a full PRD in seconds." },
  { Icon: Target, title: "RICE prioritization", text: "Auto-suggested scores you stay in control of." },
  { Icon: Route, title: "Sprint roadmaps", text: "Capacity-aware planning, computed deterministically." },
  { Icon: ScanSearch, title: "Grounded in your docs", text: "RAG over your own PDFs and specs." },
];

export default function AuthForm({ title, subtitle, submitLabel, onSubmit, footer }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  });

  // The parent decides what happens (login vs register) and handles errors/toasts. RHF keeps
  // isSubmitting true until this async resolves, driving the button's loading state.
  const submit = handleSubmit(({ email, password }) => onSubmit(email, password));

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* Theme toggle floats in the top-right of the whole auth screen. */}
      <ThemeToggle className="absolute right-4 top-4 z-10" />

      {/* Left: branded gradient feature panel (desktop only). */}
      <div className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Blueprint grid + one soft brand-green glow, echoing the landing page. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.05)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_top_left,#000_30%,transparent_75%)]"
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-grass-500/20 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-grass-400 text-ink">
            <Logo size={20} />
          </span>
          <span className="text-xl font-bold tracking-tight">
            PM <span className="font-serif font-normal italic">copilot</span>
          </span>
        </Link>

        <div className="relative space-y-8">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
              <span className="text-grass-400">— </span>AI product management
            </p>
            <h2 className="mt-4 max-w-md text-4xl font-semibold leading-[1.1] tracking-tight">
              From idea to a{" "}
              <span className="box-decoration-clone rounded-[3px] bg-grass-400 px-2 text-ink">
                sprint plan
              </span>
              .
            </h2>
          </div>
          <div className="grid max-w-md gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-4"
              >
                <f.Icon size={20} strokeWidth={1.75} className="mb-2.5 text-grass-400" />
                <div className="font-semibold">{f.title}</div>
                <div className="mt-0.5 text-sm text-white/60">{f.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative font-mono text-[11px] uppercase tracking-wider text-white/40">
          Built with FastAPI · React · Groq — a portfolio project.
        </div>
      </div>

      {/* Right: the auth card. */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile brand header (panel is hidden on small screens). */}
          <Link to="/" className="mb-8 flex justify-center lg:hidden">
            <Wordmark size={26} />
          </Link>

          <div className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight text-heading">{title}</h1>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          </div>

          <form onSubmit={submit} className="card space-y-4 p-6">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="field-error">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="At least 6 characters"
                {...register("password")}
              />
              {errors.password && (
                <p className="field-error">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" loading={isSubmitting} className="w-full">
              {submitLabel}
            </Button>

            {/* Renders only when Google sign-in is configured (VITE_GOOGLE_CLIENT_ID). */}
            <GoogleSignInButton />
          </form>

          <p className="mt-4 text-center text-sm text-muted">{footer}</p>
        </div>
      </div>
    </div>
  );
}

// Re-export Link so pages can build their footer without another import.
export { Link };

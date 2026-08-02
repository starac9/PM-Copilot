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
        {/* Decorative soft glows — one brand-green for accent. */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-grass-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <Logo size={28} />
          </span>
          <span className="text-xl font-bold tracking-tight">
            PM <span className="font-serif font-normal italic">copilot</span>
          </span>
        </Link>

        <div className="relative space-y-8">
          <h2 className="max-w-md text-3xl font-bold leading-tight">
            Your AI product manager, from idea to sprint plan.
          </h2>
          <div className="grid max-w-md gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <f.Icon size={22} strokeWidth={1.75} className="mb-2" />
                <div className="font-semibold">{f.title}</div>
                <div className="text-sm text-white/80">{f.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-sm text-white/70">
          Built with FastAPI · React · Groq — a portfolio project.
        </div>
      </div>

      {/* Right: the auth card. */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile brand header (panel is hidden on small screens). */}
          <div className="mb-6 flex justify-center lg:hidden">
            <Logo size={48} />
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-heading">{title}</h1>
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
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
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
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
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

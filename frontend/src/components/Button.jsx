// A single reusable button so every button in the app looks and behaves consistently.
// Supports variants (primary/secondary/danger/ghost) and a built-in loading state that
// disables the button and shows a spinner — important for slow actions like AI calls.
import Spinner from "./Spinner.jsx";

const VARIANTS = {
  // Flat grass-green with dark ink text — the main call-to-action, matching the landing.
  primary:
    "bg-grass-400 text-ink shadow-sm hover:bg-grass-500 focus:ring-grass-200",
  secondary:
    "bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-100",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
};

export default function Button({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <button
      // Disable while loading so users can't double-submit (e.g. generate PRD twice).
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm
        font-semibold transition-all duration-200 focus:outline-none focus:ring-4
        active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60
        disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

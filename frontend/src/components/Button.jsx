// A single reusable button so every button in the app looks and behaves consistently.
// Supports variants (primary/secondary/danger/ghost/subtle-danger), two sizes, and a built-in
// loading state that disables the button and shows a spinner — important for slow actions
// like AI calls.
import Spinner from "./Spinner.jsx";

const VARIANTS = {
  // Flat grass-green with dark ink text — the main call-to-action, matching the landing.
  primary: "bg-grass-400 text-ink shadow-sm hover:bg-grass-500 focus-visible:ring-grass-200 dark:focus-visible:ring-grass-500/30",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-slate-700/50",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-100",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-slate-700/50",
  // Low-key destructive action (Delete / Remove) that only turns red on hover.
  "ghost-danger":
    "bg-transparent text-slate-500 hover:bg-red-50 hover:text-red-600 focus-visible:ring-red-100 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:focus-visible:ring-red-500/20",
};

const SIZES = {
  md: "px-4 py-2.5 text-sm",
  sm: "px-2.5 py-1.5 text-xs",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button", // never submit a surrounding form by accident; pass type="submit" explicitly
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      // Disable while loading so users can't double-submit (e.g. generate PRD twice).
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold
        transition-all duration-200 focus:outline-none focus-visible:ring-4
        active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60
        disabled:active:scale-100 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <Spinner className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />}
      {children}
    </button>
  );
}

// The one top navigation bar for the whole platform — landing, workspace, Learn, and PM AI
// Chat — so the three pillars are always one click away. On small screens the pillar links
// drop to a second, horizontally scrollable row instead of hiding behind a menu.
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, LayoutGrid, LogOut, Sparkles } from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import Button from "./Button.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import Wordmark from "./Wordmark.jsx";

// `match` decides the active state (the workspace spans /dashboard and /projects/*).
const PILLARS = [
  { to: "/dashboard", label: "Workspace", icon: LayoutGrid, match: (p) => p.startsWith("/dashboard") || p.startsWith("/projects") },
  { to: "/learn", label: "Learn", icon: GraduationCap, match: (p) => p.startsWith("/learn") },
  { to: "/ask", label: "PM AI Chat", icon: Sparkles, match: (p) => p.startsWith("/ask") },
];

function PillarLinks({ className = "" }) {
  const { pathname } = useLocation();
  return (
    <nav className={`flex items-center gap-1 ${className}`} aria-label="Platform">
      {PILLARS.map(({ to, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <NavLink
            key={to}
            to={to}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-ink text-white dark:bg-white dark:text-ink"
                : "text-slate-500 hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
          >
            <Icon size={15} strokeWidth={2} className={active ? "text-grass-400 dark:text-grass-600" : ""} />
            {label}
          </NavLink>
        );
      })}
    </nav>
  );
}

export default function SiteNav({ wide = false }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const width = wide ? "max-w-7xl" : "max-w-6xl";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#FAFAF7]/85 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0a0d14]/85">
      <div className={`mx-auto flex ${width} items-center justify-between gap-4 px-4 py-3 sm:px-6`}>
        <Link to="/" aria-label="PM Copilot home" className="shrink-0">
          <Wordmark />
        </Link>

        <PillarLinks className="hidden md:flex" />

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              {user && (
                <span
                  title={user.email}
                  className="hidden h-10 w-10 items-center justify-center rounded-lg bg-grass-400 font-mono text-sm font-semibold text-ink lg:flex"
                >
                  {user.email?.[0]?.toUpperCase()}
                </span>
              )}
              <Button variant="secondary" onClick={handleLogout} className="!px-3" aria-label="Log out">
                <LogOut size={15} strokeWidth={2} />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden px-2 text-sm font-medium text-slate-600 transition hover:text-ink dark:text-slate-300 dark:hover:text-white sm:block"
              >
                Sign in
              </Link>
              <Link to="/register" className="btn-primary !py-2">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile: pillars on their own scrollable row. */}
      <div className="overflow-x-auto border-t border-dashed border-slate-200 px-3 py-1.5 dark:border-slate-800 md:hidden">
        <PillarLinks />
      </div>
    </header>
  );
}

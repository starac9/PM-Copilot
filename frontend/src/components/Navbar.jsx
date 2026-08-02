// Top navigation bar shown on authenticated pages. Displays the brand, a theme toggle,
// the logged-in user's email, and a logout button. Kept small and presentational.
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import Button from "./Button.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import Wordmark from "./Wordmark.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-[#FAFAF7]/85 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0a0d14]/85">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/dashboard">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          {user && (
            <span className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:flex">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-grass-400 text-xs font-semibold text-ink">
                {user.email?.[0]?.toUpperCase()}
              </span>
              {user.email}
            </span>
          )}
          <Button variant="secondary" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}

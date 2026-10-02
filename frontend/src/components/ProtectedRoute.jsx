// Route guard: wraps pages that require login. If there's no valid session, it redirects
// to /login; otherwise it renders the page inside the shared Navbar layout.
import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "./Navbar.jsx";
import Spinner from "./Spinner.jsx";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // While we're still checking for a saved session, show a spinner instead of flashing
  // the login page for a split second.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-grass-500">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="relative min-h-screen">
      {/* Faint blueprint grid behind the top of every app page, fading out downward. */}
      <div
        aria-hidden="true"
        className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,#000,transparent)]"
      />
      <Navbar />
      <main className="relative mx-auto max-w-6xl animate-fade-in-up px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  );
}

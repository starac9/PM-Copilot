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
      <div className="flex min-h-screen items-center justify-center text-brand-600">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl animate-fade-in-up px-4 py-8">{children}</main>
    </div>
  );
}

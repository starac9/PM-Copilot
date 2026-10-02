// Route guard: wraps pages that require login. If there's no valid session, it redirects
// to /login; otherwise it renders the page inside the shared platform layout.
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import SiteLayout from "./SiteLayout.jsx";
import Spinner from "./Spinner.jsx";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

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
    // Remember where they were headed (incl. ?query) so login can send them back there.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <SiteLayout>{children}</SiteLayout>;
}

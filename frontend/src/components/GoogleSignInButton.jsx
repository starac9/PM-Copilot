// Google Sign-In button. Renders Google's official button (via @react-oauth/google) and,
// on success, exchanges the returned credential for our JWT through the auth context.
// Renders nothing when Google isn't configured (no VITE_GOOGLE_CLIENT_ID), so the auth
// pages degrade gracefully to email/password only.
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

import { apiErrorMessage } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { GOOGLE_CLIENT_ID } from "../context/GoogleProvider.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useToast } from "../lib/toast.js";

export default function GoogleSignInButton() {
  const { loginWithGoogle } = useAuth();
  const { isDark } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  if (!GOOGLE_CLIENT_ID) return null; // Google sign-in not configured — hide entirely.

  async function handleSuccess(credentialResponse) {
    try {
      await loginWithGoogle(credentialResponse.credential);
      toast.dismiss();
      toast.success("Signed in with Google.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Google sign-in failed."));
    }
  }

  return (
    <div className="space-y-4">
      {/* "or" divider between Google and the email form. */}
      <div className="flex items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        or
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => toast.error("Google sign-in was cancelled.")}
          theme={isDark ? "filled_black" : "outline"}
          shape="pill"
          width="320"
          text="continue_with"
        />
      </div>
    </div>
  );
}

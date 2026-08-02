// Wraps the app in Google's OAuth provider ONLY when a client id is configured
// (VITE_GOOGLE_CLIENT_ID). This way the app still runs fine with Google sign-in simply
// hidden when the id isn't set — no crashes, no required config for local dev.
import { GoogleOAuthProvider } from "@react-oauth/google";

// Exported so components (e.g. the sign-in button) can check whether to render themselves.
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function GoogleProvider({ children }) {
  if (!GOOGLE_CLIENT_ID) return children;
  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>;
}

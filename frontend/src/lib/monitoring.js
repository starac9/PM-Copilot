// Optional error tracking with Sentry. Only active when VITE_SENTRY_DSN is set at build time;
// the SDK is loaded with a dynamic import, so without a DSN no extra code ships to visitors.
const DSN = import.meta.env.VITE_SENTRY_DSN;
let sentry = null;

export async function initMonitoring() {
  if (!DSN) return;
  try {
    sentry = await import("@sentry/react");
    sentry.init({ dsn: DSN, tracesSampleRate: 0, sendDefaultPii: false });
  } catch {
    sentry = null; // blocked by an ad blocker, etc. — the app works the same
  }
}

// Report an error caught by our ErrorBoundary (no-op when monitoring is off).
export function reportError(error, extra) {
  sentry?.captureException(error, { extra });
}

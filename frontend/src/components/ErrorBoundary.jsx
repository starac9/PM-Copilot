// A React error boundary: if a component throws while rendering, this catches it and shows
// a friendly fallback instead of a blank white screen (React unmounts the whole tree on an
// uncaught render error). We wrap each route in one so a crash in, say, the Stories page
// doesn't take down the navbar or the rest of the app.
//
// Error boundaries MUST be class components — there's no hook equivalent for
// componentDidCatch. This is the one place we still use a class.
import { Component } from "react";
import { AlertTriangle } from "lucide-react";

import Button from "./Button.jsx";

export default class ErrorBoundary extends Component {
  state = { error: null };

  // React calls this after a descendant throws; returning state re-renders the fallback.
  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // In a real app this is where we'd report to Sentry/etc. For now, log for debugging.
    console.error("Render error caught by ErrorBoundary:", error, info);
  }

  // Clear the error so children get a fresh mount and can try to render again.
  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="logo-mark h-14 w-14">
            <AlertTriangle size={24} strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-heading">Something went wrong</h2>
            <p className="mt-1 max-w-sm text-sm text-muted">
              This part of the app hit an unexpected error. Try again, or reload the page.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={this.reset}>Try again</Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Reload
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

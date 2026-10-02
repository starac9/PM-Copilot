// App bootstrap: mount React, wrap the whole tree in the router + our providers.
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import ThemedToaster from "./components/ThemedToaster.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import GoogleProvider from "./context/GoogleProvider.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { initMonitoring } from "./lib/monitoring.js";
import { queryClient } from "./lib/queryClient.js";
import "./index.css";

initMonitoring(); // no-op unless VITE_SENTRY_DSN is set

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* BrowserRouter enables client-side routing (URLs without page reloads). */}
    <BrowserRouter>
      {/* ThemeProvider (light/dark) wraps everything so any screen — and the toaster — can
          read/toggle it. */}
      <ThemeProvider>
        {/* QueryClientProvider gives every component access to the shared data cache. */}
        <QueryClientProvider client={queryClient}>
          {/* GoogleProvider is a no-op unless VITE_GOOGLE_CLIENT_ID is set. */}
          <GoogleProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </GoogleProvider>
          {/* Sonner renders toasts in a portal above everything, theme-matched. */}
          <ThemedToaster />
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

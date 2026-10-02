// Central API client. Every network call goes through this axios instance so that:
//   - the base URL comes from ONE place (VITE_API_URL), never hard-coded in components;
//   - the JWT is automatically attached to every request;
//   - a 401 (expired/invalid token) automatically logs the user out.
import axios from "axios";

// import.meta.env.VITE_API_URL is injected by Vite at build time from the .env file.
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL });

// Key under which we persist the JWT in the browser's localStorage.
export const TOKEN_KEY = "pmcopilot_token";
export const USER_KEY = "pmcopilot_user";

// Request interceptor: before each request, attach the saved token (if any).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: if the server ever says 401, the token is dead — clear it and
// send the user back to login. We do this once here instead of in every component.
//
// IMPORTANT: Do NOT redirect on auth-endpoint 401s (login/register/google) — those are
// expected "wrong credentials" failures, not expired sessions. Redirecting there would
// reload the page before the error toast can fire.
const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/google"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = AUTH_PATHS.some((p) =>
      error.config?.url?.includes(p)
    );
    if (error.response && error.response.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // Full reload to /login clears any stale in-memory state cleanly.
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

// Small helper: pull a human-readable message out of an error for toasts.
//
// Zod validation failures (a response that didn't match lib/schemas.js) are handled
// specially: their `.message` is a giant JSON dump of every issue, which is useless in a
// toast. We show a short line to the user and log the real detail to the console, where
// it's actually debuggable.
export function apiErrorMessage(error, fallback = "Something went wrong.") {
  if (Array.isArray(error?.issues)) {
    console.error("Response failed schema validation:", error.issues);
    const where = error.issues[0]?.path?.join(".");
    return `The server returned unexpected data${where ? ` (${where})` : ""}.`;
  }
  const detail = error?.response?.data?.detail;
  // FastAPI validation errors (422) send `detail` as a list of {loc, msg} objects. Rendering
  // that array in a toast would crash React, so surface the first message instead.
  if (Array.isArray(detail)) {
    const first = detail[0];
    const field = first?.loc?.filter((p) => p !== "body").join(".");
    return first?.msg ? `${field ? `${field}: ` : ""}${first.msg}` : fallback;
  }
  if (typeof detail === "string") return detail;
  // Network failure (backend down / CORS) has no response at all.
  if (error?.request && !error?.response) return "Can't reach the server. Is the backend running?";
  return error?.message || fallback;
}

export default api;

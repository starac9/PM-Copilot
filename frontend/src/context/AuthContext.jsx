// Auth state shared across the whole app via React Context.
// It holds the current user + token and exposes login/register/logout helpers, so any
// component can call `useAuth()` instead of passing props down manually.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import api, { TOKEN_KEY, USER_KEY } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // user: { id, email } or null. token: the JWT string or null.
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  // loading covers the initial "do we have a saved session?" check on first render.
  const [loading, setLoading] = useState(true);
  // Cached server data belongs to whoever was logged in; it must not leak across sessions.
  const queryClient = useQueryClient();

  // On mount only: restore the cached user from localStorage so a page refresh keeps you
  // logged in without a round-trip to the server. We use [] so this runs exactly once —
  // re-running on every token change would create a state-update loop.
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        // Corrupted stored user — clear it so the user is prompted to log in again.
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
      }
    }
    setLoading(false);

    // Sliding session: swap the saved token for a fresh one in the background, so people who
    // keep using the app are never logged out. A 401 means it already expired → sign out
    // quietly. Network errors keep the session (the backend may just be waking up).
    if (savedToken) {
      api
        .post("/auth/refresh")
        .then(({ data }) => {
          localStorage.setItem(TOKEN_KEY, data.access_token);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          setToken(data.access_token);
          setUser(data.user);
        })
        .catch((err) => {
          if (err.response?.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setToken(null);
            setUser(null);
          }
        });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist a fresh session ({access_token, user}) returned by any of the auth endpoints.
  const startSession = useCallback(
    (data) => {
      queryClient.clear();
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    },
    [queryClient]
  );

  // Shared logic for both register and login, which return the same {access_token, user}.
  const authenticate = useCallback(
    async (path, email, password) => {
      const { data } = await api.post(path, { email, password });
      return startSession(data);
    },
    [startSession]
  );

  const login = useCallback(
    (email, password) => authenticate("/auth/login", email, password),
    [authenticate]
  );
  const register = useCallback(
    (email, password) => authenticate("/auth/register", email, password),
    [authenticate]
  );

  // Google Sign-In: exchange the Google ID-token credential for our own JWT + user, then
  // store them exactly like email/password login.
  const loginWithGoogle = useCallback(
    async (credential) => {
      const { data } = await api.post("/auth/google", { credential });
      return startSession(data);
    },
    [startSession]
  );

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    await api.put("/auth/password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Learning state belongs to the account once signed in (it's synced server-side), so
    // don't leave it behind for whoever uses this browser next.
    localStorage.removeItem("pmcopilot_learn_done");
    localStorage.removeItem("pmcopilot_mentor_chat");
    window.dispatchEvent(new Event("pmcopilot:learn-progress"));
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  // useMemo avoids recreating the value object on every render (perf hygiene).
  // With stable useCallback refs above, this only re-runs when user/token/loading change.
  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!token,
      login,
      register,
      loginWithGoogle,
      changePassword,
      logout,
    }),
    [user, token, loading, login, register, loginWithGoogle, changePassword, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Convenience hook so components do `const { user, login } = useAuth();`.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
}

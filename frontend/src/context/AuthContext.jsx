// Auth state shared across the whole app via React Context.
// It holds the current user + token and exposes login/register/logout helpers, so any
// component can call `useAuth()` instead of passing props down manually.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import api, { TOKEN_KEY } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // user: { id, email } or null. token: the JWT string or null.
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  // loading covers the initial "do we have a saved session?" check on first render.
  const [loading, setLoading] = useState(true);

  // On mount only: restore the cached user from localStorage so a page refresh keeps you
  // logged in without a round-trip to the server. We use [] so this runs exactly once —
  // re-running on every token change would create a state-update loop.
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem("pmcopilot_user");
    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        // Corrupted stored user — clear it so the user is prompted to log in again.
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("pmcopilot_user");
        setToken(null);
      }
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Shared logic for both register and login, which return the same {access_token, user}.
  const authenticate = useCallback(async (path, email, password) => {
    const { data } = await api.post(path, { email, password });
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem("pmcopilot_user", JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

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
  const loginWithGoogle = useCallback(async (credential) => {
    const { data } = await api.post("/auth/google", { credential });
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem("pmcopilot_user", JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("pmcopilot_user");
    setToken(null);
    setUser(null);
  }, []);

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
      logout,
    }),
    [user, token, loading, login, register, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Convenience hook so components do `const { user, login } = useAuth();`.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
}

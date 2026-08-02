// Auth state shared across the whole app via React Context.
// It holds the current user + token and exposes login/register/logout helpers, so any
// component can call `useAuth()` instead of passing props down manually.
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import api, { TOKEN_KEY } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // user: { id, email } or null. token: the JWT string or null.
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  // loading covers the initial "do we have a saved session?" check on first render.
  const [loading, setLoading] = useState(true);

  // On first load, if we have a token, restore the cached user so a refresh keeps you
  // logged in. (We cache the user object in localStorage alongside the token.)
  useEffect(() => {
    const savedUser = localStorage.getItem("pmcopilot_user");
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, [token]);

  // Shared logic for both register and login, which return the same {access_token, user}.
  async function authenticate(path, email, password) {
    const { data } = await api.post(path, { email, password });
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem("pmcopilot_user", JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  }

  const login = (email, password) => authenticate("/auth/login", email, password);
  const register = (email, password) => authenticate("/auth/register", email, password);

  // Google Sign-In: exchange the Google ID-token credential for our own JWT + user, then
  // store them exactly like email/password login.
  async function loginWithGoogle(credential) {
    const { data } = await api.post("/auth/google", { credential });
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem("pmcopilot_user", JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("pmcopilot_user");
    setToken(null);
    setUser(null);
  }

  // useMemo avoids recreating the value object on every render (perf hygiene).
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
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Convenience hook so components do `const { user, login } = useAuth();`.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
}

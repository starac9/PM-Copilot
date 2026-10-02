// Which lessons are complete. Always mirrored in localStorage (instant, works signed out),
// and — when signed in — synced with the account (/me/learn-progress) so progress follows
// the user across devices. A window event keeps the sidebar, overview, and lesson page in
// sync without a context provider.
import { useCallback, useEffect, useState } from "react";

import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export const LEARN_PROGRESS_KEY = "pmcopilot_learn_done";
const EVENT = "pmcopilot:learn-progress";

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEARN_PROGRESS_KEY) || "[]");
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set(); // storage blocked (private mode) or corrupted — start fresh
  }
}

function write(set) {
  try {
    localStorage.setItem(LEARN_PROGRESS_KEY, JSON.stringify([...set]));
  } catch {
    /* storage unavailable: progress lives in memory only */
  }
  window.dispatchEvent(new Event(EVENT));
}

// One merge per session token, shared by every component using the hook: lessons finished
// in this browser (maybe before signing in) are added to the account, and the account's
// lessons come back down.
let syncedFor = null;
function syncWithAccount(token) {
  if (syncedFor === token) return;
  syncedFor = token;
  api
    .post("/me/learn-progress/sync", { completed: [...read()] })
    .then(({ data }) => write(new Set([...read(), ...data.completed])))
    .catch(() => {
      syncedFor = null; // retry on the next mount
    });
}

export function useLearnProgress() {
  const { isAuthenticated } = useAuth();
  const [done, setDone] = useState(read);

  useEffect(() => {
    const sync = () => setDone(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync); // other tabs
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setComplete = useCallback(
    (slug, complete) => {
      const next = read();
      if (complete) next.add(slug);
      else next.delete(slug);
      write(next);
      if (isAuthenticated) {
        const call = complete ? api.put : api.delete;
        call(`/me/learn-progress/${slug}`).catch(() => {}); // local copy already updated
      }
    },
    [isAuthenticated]
  );

  return { done, setComplete };
}

// Mounted once at the app root (see App.jsx): merges progress the moment someone signs in,
// on whatever page they land — not only when a Learn page happens to be open.
export function LearnProgressSync() {
  const { isAuthenticated, token } = useAuth();
  useEffect(() => {
    if (isAuthenticated && token) syncWithAccount(token);
  }, [isAuthenticated, token]);
  return null;
}

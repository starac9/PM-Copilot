// Which lessons this browser has marked complete. Stored in localStorage (a per-viewer
// reading convenience, like a bookmark) and broadcast with a window event so the sidebar,
// overview, and lesson page stay in sync without a context provider.
import { useCallback, useEffect, useState } from "react";

const KEY = "pmcopilot_learn_done";
const EVENT = "pmcopilot:learn-progress";

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set(); // storage blocked (private mode) or corrupted — start fresh
  }
}

export function useLearnProgress() {
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

  const setComplete = useCallback((slug, complete) => {
    const next = read();
    if (complete) next.add(slug);
    else next.delete(slug);
    try {
      localStorage.setItem(KEY, JSON.stringify([...next]));
    } catch {
      /* storage unavailable: progress just won't persist */
    }
    setDone(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { done, setComplete };
}

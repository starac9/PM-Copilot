// The single React Query client for the whole app. It owns the in-memory cache, so once a
// page has loaded data (e.g. the project list), navigating away and back shows it instantly
// while a fresh copy is refetched in the background — no more manual loading spinners on
// every visit.
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Treat data as fresh for 30s: rapid back-and-forth navigation won't refetch.
      staleTime: 30_000,
      // Don't hammer the server on genuine client errors (401/403/404 won't fix on retry).
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

// Centralized query keys so cache reads/writes and invalidations always agree on the
// exact key. (A typo'd string key is the classic React Query bug — this prevents it.)
export const qk = {
  projects: ["projects"],
  project: (id) => ["project", String(id)],
  prd: (id) => ["prd", String(id)],
  stories: (id) => ["stories", String(id)],
  documents: (id) => ["documents", String(id)],
  workspace: (id) => ["workspace", String(id)],
  artifact: (id, type) => ["artifact", String(id), type],
};

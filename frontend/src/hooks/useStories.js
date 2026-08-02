// React Query hooks for a project's user stories + roadmap. Like the PRD, a 404 from GET
// /stories means "not generated yet" and maps to null. The roadmap is a one-off mutation
// (computed server-side from a capacity input) rather than persisted state, so it isn't
// cached as a query.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "../api/client.js";
import { qk } from "../lib/queryClient.js";
import { roadmapSchema, storySetSchema } from "../lib/schemas.js";

export function useStories(projectId) {
  return useQuery({
    queryKey: qk.stories(projectId),
    queryFn: async () => {
      try {
        const res = await api.get(`/projects/${projectId}/stories`);
        return storySetSchema.parse(res.data).content;
      } catch (err) {
        if (err.response?.status === 404) return null; // not generated yet
        throw err;
      }
    },
    enabled: !!projectId,
  });
}

export function useGenerateStories(projectId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/projects/${projectId}/stories/generate`);
      return storySetSchema.parse(data).content;
    },
    onSuccess: (content) => client.setQueryData(qk.stories(projectId), content),
  });
}

export function useSaveStories(projectId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (content) => {
      const { data } = await api.put(`/projects/${projectId}/stories`, { content });
      return storySetSchema.parse(data).content;
    },
    onSuccess: (content) => client.setQueryData(qk.stories(projectId), content),
  });
}

export function useBuildRoadmap(projectId) {
  return useMutation({
    mutationFn: async (capacity) => {
      const { data } = await api.post(`/projects/${projectId}/stories/roadmap`, {
        capacity: Number(capacity),
      });
      return roadmapSchema.parse(data);
    },
  });
}

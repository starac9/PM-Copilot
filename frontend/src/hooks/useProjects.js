// React Query hooks for projects: fetching the list / a single project, and the create /
// delete mutations. Components call these instead of talking to axios directly, so caching,
// background refetching, and cache invalidation are handled in one place.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "../api/client.js";
import { qk } from "../lib/queryClient.js";
import { projectListSchema, projectSchema } from "../lib/schemas.js";

export function useProjects() {
  return useQuery({
    queryKey: qk.projects,
    queryFn: async () => {
      const { data } = await api.get("/projects");
      return projectListSchema.parse(data);
    },
  });
}

export function useProject(projectId) {
  return useQuery({
    queryKey: qk.project(projectId),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}`);
      return projectSchema.parse(data);
    },
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/projects", payload);
      return projectSchema.parse(data);
    },
    // The list is now stale — refetch it so the new project appears everywhere.
    onSuccess: () => client.invalidateQueries({ queryKey: qk.projects }),
  });
}

export function useDeleteProject() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (projectId) => api.delete(`/projects/${projectId}`),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.projects }),
  });
}

// React Query hooks for the PM artifact workspace. One workspace query returns the catalog
// of available artifact types plus which ones are generated; the rest generate / fetch /
// save / delete a single artifact by type. Generate and delete invalidate the workspace so
// the grid stays in sync.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "../api/client.js";
import { qk } from "../lib/queryClient.js";
import { artifactSchema, workspaceSchema } from "../lib/schemas.js";

export function useWorkspace(projectId) {
  return useQuery({
    queryKey: qk.workspace(projectId),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/artifacts`);
      return workspaceSchema.parse(data);
    },
    enabled: !!projectId,
  });
}

export function useArtifact(projectId, type) {
  return useQuery({
    queryKey: qk.artifact(projectId, type),
    queryFn: async () => {
      try {
        const { data } = await api.get(`/projects/${projectId}/artifacts/${type}`);
        return artifactSchema.parse(data);
      } catch (err) {
        if (err.response?.status === 404) return null; // not generated yet
        throw err;
      }
    },
    enabled: !!projectId && !!type,
  });
}

export function useGenerateArtifact(projectId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (type) => {
      const { data } = await api.post(`/projects/${projectId}/artifacts/${type}/generate`);
      return artifactSchema.parse(data);
    },
    onSuccess: (artifact) => {
      client.setQueryData(qk.artifact(projectId, artifact.type), artifact);
      client.invalidateQueries({ queryKey: qk.workspace(projectId) });
    },
  });
}

export function useSaveArtifact(projectId, type) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (content) => {
      const { data } = await api.put(`/projects/${projectId}/artifacts/${type}`, { content });
      return artifactSchema.parse(data);
    },
    onSuccess: (artifact) => {
      client.setQueryData(qk.artifact(projectId, type), artifact);
      client.invalidateQueries({ queryKey: qk.workspace(projectId) });
    },
  });
}

export function useDeleteArtifact(projectId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (type) => api.delete(`/projects/${projectId}/artifacts/${type}`),
    onSuccess: (_data, type) => {
      client.removeQueries({ queryKey: qk.artifact(projectId, type) });
      client.invalidateQueries({ queryKey: qk.workspace(projectId) });
    },
  });
}

// React Query hooks for a project's RAG reference documents: list, upload, delete.
// Uploads and deletes invalidate the list so it refetches with the new state.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "../api/client.js";
import { qk } from "../lib/queryClient.js";
import { documentListSchema, documentSchema } from "../lib/schemas.js";

export function useDocuments(projectId) {
  return useQuery({
    queryKey: qk.documents(projectId),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/documents`);
      return documentListSchema.parse(data);
    },
    enabled: !!projectId,
  });
}

export function useUploadDocument(projectId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (file) => {
      // multipart/form-data — axios sets the boundary header automatically for FormData.
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post(`/projects/${projectId}/documents`, form);
      return documentSchema.parse(data);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: qk.documents(projectId) }),
  });
}

export function useDeleteDocument(projectId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (documentId) => api.delete(`/projects/${projectId}/documents/${documentId}`),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.documents(projectId) }),
  });
}

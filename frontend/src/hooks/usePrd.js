// React Query hooks for a project's PRD: load it, generate it, and save edits.
//
// A 404 from GET /prd is EXPECTED — it just means "not generated yet" — so the query maps
// it to null rather than treating it as an error. Generation also reports which uploaded
// documents grounded it (RAG) via the X-Context-Documents response header.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "../api/client.js";
import { qk } from "../lib/queryClient.js";
import { prdSchema } from "../lib/schemas.js";

function parseContextDocs(response) {
  const used = response.headers["x-context-documents"];
  return used ? used.split(",").filter(Boolean) : [];
}

export function usePrd(projectId) {
  return useQuery({
    queryKey: qk.prd(projectId),
    queryFn: async () => {
      try {
        const res = await api.get(`/projects/${projectId}/prd`);
        return prdSchema.parse(res.data).content;
      } catch (err) {
        if (err.response?.status === 404) return null; // not generated yet
        throw err;
      }
    },
    enabled: !!projectId,
  });
}

export function useGeneratePrd(projectId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(`/projects/${projectId}/prd/generate`);
      return { content: prdSchema.parse(res.data).content, contextDocs: parseContextDocs(res) };
    },
    onSuccess: ({ content }) => {
      client.setQueryData(qk.prd(projectId), content);
      // The dashboard badge (has_prd) and this project's row are now stale.
      client.invalidateQueries({ queryKey: qk.projects });
      client.invalidateQueries({ queryKey: qk.project(projectId) });
    },
  });
}

export function useUpdatePrd(projectId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (content) => {
      const { data } = await api.put(`/projects/${projectId}/prd`, { content });
      return prdSchema.parse(data).content;
    },
    onSuccess: (content) => client.setQueryData(qk.prd(projectId), content),
  });
}

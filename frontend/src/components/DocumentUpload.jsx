// Per-project reference documents (RAG). Users upload PDFs/Markdown that get chunked and
// embedded on the backend; PRD/story generation then retrieves relevant pieces as context.
// This component lists the uploaded docs (via useDocuments) and lets the user add or remove
// them (upload/delete mutations invalidate the list so it stays in sync).
import { useRef } from "react";
import { FileText, Library, Upload, X } from "lucide-react";

import { apiErrorMessage } from "../api/client.js";
import {
  useDeleteDocument,
  useDocuments,
  useUploadDocument,
} from "../hooks/useDocuments.js";
import { useToast } from "../lib/toast.js";
import Button from "./Button.jsx";

export default function DocumentUpload({ projectId }) {
  const fileInput = useRef(null);
  const toast = useToast();

  const { data: documents = [] } = useDocuments(projectId);
  const uploadDocument = useUploadDocument(projectId);
  const deleteDocument = useDeleteDocument(projectId);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const doc = await uploadDocument.mutateAsync(file);
      toast.success(`Uploaded ${doc.filename}.`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not upload the file."));
    } finally {
      if (fileInput.current) fileInput.current.value = ""; // allow re-uploading same file
    }
  }

  async function handleDelete(doc) {
    try {
      await deleteDocument.mutateAsync(doc.id);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not delete the document."));
    }
  }

  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="icon-tile h-9 w-9">
            <Library size={16} strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-heading">Reference documents</h3>
            <p className="text-xs text-muted">
              {documents.length === 0
                ? "Optional · PDF or Markdown, up to 10 MB — grounds every generation in your own domain."
                : `${documents.length} document${documents.length === 1 ? "" : "s"} grounding PRDs, stories, and workspace artifacts.`}
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          loading={uploadDocument.isPending}
          onClick={() => fileInput.current?.click()}
        >
          {!uploadDocument.isPending && <Upload size={15} strokeWidth={2} />}
          {uploadDocument.isPending ? "Embedding…" : "Upload"}
        </Button>
        {/* Hidden native input; the styled button triggers it. */}
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.md,.markdown,.txt"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {documents.length > 0 && (
        <ul className="rule flex flex-wrap gap-2 pt-4">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-[#FAFAF7] py-1 pl-2.5 pr-1 text-sm text-body dark:border-slate-700 dark:bg-slate-950"
            >
              <FileText size={14} strokeWidth={1.75} className="shrink-0 text-grass-600 dark:text-grass-400" />
              <span className="truncate">{doc.filename}</span>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                {doc.chunk_count} chunk{doc.chunk_count === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(doc)}
                disabled={deleteDocument.isPending}
                aria-label={`Remove ${doc.filename}`}
                className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

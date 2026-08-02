// Per-project reference documents (RAG). Users upload PDFs/Markdown that get chunked and
// embedded on the backend; PRD/story generation then retrieves relevant pieces as context.
// This component lists the uploaded docs (via useDocuments) and lets the user add or remove
// them (upload/delete mutations invalidate the list so it stays in sync).
import { useRef } from "react";
import { FileText, Library, Upload } from "lucide-react";

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
    <div className="card space-y-3 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
            <Library size={16} strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-heading">Reference documents</h3>
            <p className="text-xs text-muted">
              PDF or Markdown — grounds PRD &amp; story generation in your own domain (RAG).
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          loading={uploadDocument.isPending}
          onClick={() => fileInput.current?.click()}
        >
          <Upload size={15} strokeWidth={2} /> Upload
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

      {documents.length === 0 ? (
        <p className="text-sm text-muted">No documents yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between py-2">
              <span className="flex items-center gap-1.5 text-sm text-body">
                <FileText size={14} strokeWidth={1.75} className="text-slate-400" />
                {doc.filename}
                <span className="ml-1 text-xs text-muted">{doc.chunk_count} chunks</span>
              </span>
              <Button variant="ghost" onClick={() => handleDelete(doc)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

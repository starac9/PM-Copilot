// A modal that views and edits a single PM artifact. Because every artifact shares the same
// shape (a summary + titled, bulleted sections), this one component renders and edits ALL of
// them — strategy, OKRs, GTM, release notes, and so on.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, RefreshCw, Trash2, X } from "lucide-react";

import { apiErrorMessage } from "../api/client.js";
import { useArtifact, useDeleteArtifact, useSaveArtifact } from "../hooks/useArtifacts.js";
import { useToast } from "../lib/toast.js";
import Button from "./Button.jsx";
import { Eyebrow } from "./PageHeader.jsx";
import Spinner from "./Spinner.jsx";

export default function ArtifactModal({ projectId, type, label, onClose, onRegenerate, regenerating }) {
  const toast = useToast();
  const { data: artifact, isLoading } = useArtifact(projectId, type);
  const save = useSaveArtifact(projectId, type);
  const del = useDeleteArtifact(projectId);

  const [draft, setDraft] = useState(null); // non-null while editing
  const editing = draft !== null;

  // Escape backs out one level: first out of edit mode, then closes the modal.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (editing) setDraft(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, editing]);

  // Lock page scroll behind the modal.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const content = artifact?.content;

  function startEdit() {
    setDraft(JSON.parse(JSON.stringify(content))); // deep clone so edits are cancellable
  }

  function updateSection(i, patch) {
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s, si) => (si === i ? { ...s, ...patch } : s)),
    }));
  }

  async function handleSave() {
    // Drop blank bullet lines only at save time (so typing empty lines still works).
    const cleaned = {
      summary: draft.summary,
      sections: draft.sections.map((s) => ({
        title: s.title,
        body: s.body.filter((b) => b.trim() !== ""),
      })),
    };
    try {
      await save.mutateAsync(cleaned);
      setDraft(null);
      toast.success("Saved.");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save."));
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete this ${label}? This can't be undone.`)) return;
    try {
      await del.mutateAsync(type);
      toast.success("Deleted.");
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not delete."));
    }
  }

  // Portaled to <body>: the page's <main> keeps a transform from its entrance animation,
  // which would otherwise trap this `fixed` overlay inside the content column.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={() => !editing && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="card flex max-h-[92vh] w-full max-w-2xl animate-fade-in-up flex-col overflow-hidden rounded-b-none p-0 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.6)] sm:max-h-[85vh] sm:rounded-b-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-grid flex items-center justify-between border-b border-dashed border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <Eyebrow>{editing ? "Editing" : "Artifact"}</Eyebrow>
            <h2 className="mt-1 text-lg font-semibold text-heading">{label}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading || !content ? (
            <div className="flex justify-center py-16 text-brand-500">
              <Spinner className="h-7 w-7" />
            </div>
          ) : editing ? (
            <div className="space-y-4">
              <div>
                <label className="label">Summary</label>
                <textarea
                  className="input min-h-[60px]"
                  value={draft.summary}
                  onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
                />
              </div>
              {draft.sections.map((s, i) => (
                <div key={i} className="card-dashed space-y-2 p-3">
                  <input
                    className="input font-medium"
                    value={s.title}
                    onChange={(e) => updateSection(i, { title: e.target.value })}
                  />
                  <textarea
                    className="input min-h-[90px] font-mono text-xs"
                    value={s.body.join("\n")}
                    onChange={(e) => updateSection(i, { body: e.target.value.split("\n") })}
                  />
                  <p className="text-xs text-muted">One bullet per line.</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              <p className="border-l-2 border-grass-400 pl-3 text-sm leading-relaxed text-body">
                {content.summary}
              </p>
              {content.sections.map((s, i) => (
                <div key={i}>
                  <h4 className="flex items-center gap-2 font-semibold text-heading">
                    <span className="font-mono text-[10px] text-grass-600 dark:text-grass-400">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.title}
                  </h4>
                  <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-body">
                    {s.body.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {content && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-slate-200 px-6 py-4 dark:border-slate-800">
            {editing ? (
              <div className="flex gap-2">
                <Button loading={save.isPending} onClick={handleSave}>
                  Save changes
                </Button>
                <Button variant="secondary" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={startEdit}>
                  <Pencil size={14} /> Edit
                </Button>
                <Button variant="secondary" loading={regenerating} onClick={onRegenerate}>
                  {!regenerating && <RefreshCw size={14} />} Regenerate
                </Button>
              </div>
            )}
            {!editing && (
              <Button variant="ghost-danger" loading={del.isPending} onClick={handleDelete}>
                {!del.isPending && <Trash2 size={14} />} Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

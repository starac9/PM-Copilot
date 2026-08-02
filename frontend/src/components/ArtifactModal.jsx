// A modal that views and edits a single PM artifact. Because every artifact shares the same
// shape (a summary + titled, bulleted sections), this one component renders and edits ALL of
// them — strategy, OKRs, GTM, release notes, and so on.
import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { apiErrorMessage } from "../api/client.js";
import { useArtifact, useDeleteArtifact, useSaveArtifact } from "../hooks/useArtifacts.js";
import { useToast } from "../lib/toast.js";
import Button from "./Button.jsx";
import Spinner from "./Spinner.jsx";

export default function ArtifactModal({ projectId, type, label, onClose, onRegenerate, regenerating }) {
  const toast = useToast();
  const { data: artifact, isLoading } = useArtifact(projectId, type);
  const save = useSaveArtifact(projectId, type);
  const del = useDeleteArtifact(projectId);

  const [draft, setDraft] = useState(null); // non-null while editing
  const editing = draft !== null;

  // Close on Escape for a native-feeling modal.
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card flex max-h-[85vh] w-full max-w-2xl flex-col p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-heading">{label}</h2>
          <button
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
                <div key={i} className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
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
              <p className="text-sm italic text-muted">{content.summary}</p>
              {content.sections.map((s, i) => (
                <div key={i}>
                  <h4 className="font-semibold text-heading">{s.title}</h4>
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
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
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
                  Edit
                </Button>
                <Button variant="secondary" loading={regenerating} onClick={onRegenerate}>
                  Regenerate
                </Button>
              </div>
            )}
            {!editing && (
              <button
                onClick={handleDelete}
                className="rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

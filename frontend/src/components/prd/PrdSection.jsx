// A single PRD section rendered as a card with a title and an Edit / Save / Cancel
// control in the header. It's purely presentational: the parent (PrdViewer) owns the
// data and decides what happens on save. Keeping this "dumb" means every section looks
// and behaves identically for free.
import { Pencil } from "lucide-react";

import Button from "../Button.jsx";

export default function PrdSection({
  title,
  icon,
  editing,
  saving,
  onEdit,
  onCancel,
  onSave,
  children,
}) {
  return (
    <section className="card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
              {icon}
            </span>
          )}
          <h3 className="text-base font-semibold text-heading">{title}</h3>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button loading={saving} onClick={onSave}>
              Save
            </Button>
          </div>
        ) : (
          <Button variant="ghost" onClick={onEdit}>
            <Pencil size={14} /> Edit
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}

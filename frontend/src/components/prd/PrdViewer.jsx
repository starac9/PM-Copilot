// Renders a full PRD as five editable sections. The live content comes from the React Query
// cache (passed in as `content`); saving PUTs the WHOLE document via useUpdatePrd, which
// re-validates it against the PRDContent schema server-side and updates the cache — so this
// component doesn't hold its own copy of the saved content, only the in-progress edit.
//
// Only one section is editable at a time (tracked by `editingKey`). When you click Edit we
// clone the content into `draft`; PrdEditor mutates that draft; Save commits it.
import { useState } from "react";
import { AlertTriangle, Puzzle, Target, TrendingUp, Users } from "lucide-react";

import { apiErrorMessage } from "../../api/client.js";
import { useUpdatePrd } from "../../hooks/usePrd.js";
import { useToast } from "../../lib/toast.js";
import PrdEditor from "./PrdEditor.jsx";
import PrdSection from "./PrdSection.jsx";

// The sections in display order, with their human-readable titles and a line icon.
const SECTIONS = [
  { key: "problem_statement", title: "Problem statement", Icon: Puzzle },
  { key: "personas", title: "Target personas", Icon: Users },
  { key: "success_metrics", title: "Success metrics", Icon: TrendingUp },
  { key: "scope", title: "Scope", Icon: Target },
  { key: "risks_and_assumptions", title: "Risks & assumptions", Icon: AlertTriangle },
];

// A reusable bulleted list for the read-only view.
function BulletList({ items }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-body">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrdViewer({ projectId, content }) {
  const [editingKey, setEditingKey] = useState(null); // which section is open, or null
  const [draft, setDraft] = useState(null); // working copy while editing
  const toast = useToast();
  const updatePrd = useUpdatePrd(projectId);

  function startEdit(key) {
    // Deep-clone so edits don't mutate the cached content until the user saves.
    setDraft(JSON.parse(JSON.stringify(content)));
    setEditingKey(key);
  }

  function cancelEdit() {
    setEditingKey(null);
    setDraft(null);
  }

  async function save() {
    try {
      // Send the full document; the backend validates it against PRDContent and the hook
      // writes the returned content back into the query cache.
      await updatePrd.mutateAsync(draft);
      setEditingKey(null);
      setDraft(null);
      toast.success("Saved.");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save changes."));
    }
  }

  // Read-only rendering for each section (used when that section isn't being edited).
  function renderView(key) {
    if (key === "problem_statement") {
      return <p className="text-sm text-body">{content.problem_statement}</p>;
    }
    if (key === "personas") {
      return (
        <div className="space-y-4">
          {content.personas.map((p, i) => (
            <div key={i}>
              <p className="font-medium text-heading">{p.name}</p>
              <p className="mb-1 text-sm text-muted">{p.description}</p>
              <BulletList items={p.pain_points} />
            </div>
          ))}
        </div>
      );
    }
    if (key === "success_metrics") return <BulletList items={content.success_metrics} />;
    if (key === "risks_and_assumptions")
      return <BulletList items={content.risks_and_assumptions} />;
    if (key === "scope") {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">In scope</p>
            <BulletList items={content.scope.in_scope} />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">Out of scope</p>
            <BulletList items={content.scope.out_of_scope} />
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="space-y-4">
      {SECTIONS.map(({ key, title, Icon }) => {
        const editing = editingKey === key;
        return (
          <PrdSection
            key={key}
            title={title}
            icon={<Icon size={16} strokeWidth={1.75} />}
            editing={editing}
            saving={updatePrd.isPending}
            onEdit={() => startEdit(key)}
            onCancel={cancelEdit}
            onSave={save}
          >
            {editing ? (
              <PrdEditor sectionKey={key} draft={draft} setDraft={setDraft} />
            ) : (
              renderView(key)
            )}
          </PrdSection>
        );
      })}
    </div>
  );
}

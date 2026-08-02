// The edit form for ONE PRD section. It reads and writes a `draft` copy of the whole PRD
// held by PrdViewer, so saving is just "PUT the draft". We render a different form per
// section because the shapes differ (plain text vs. list vs. nested personas).
//
// DESIGN CHOICE — lists as one-item-per-line text: for simple string lists (metrics,
// risks, scope) we edit a textarea and split on newlines. It's far less fiddly than
// add/remove-row widgets and keeps the code readable, which matters for this project.
import Button from "../Button.jsx";

// Convert between a string list and newline-separated text for textarea editing.
const listToLines = (list) => (list || []).join("\n");
const linesToList = (text) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export default function PrdEditor({ sectionKey, draft, setDraft }) {
  // Small helper to update one top-level field of the draft immutably.
  const update = (field, value) => setDraft({ ...draft, [field]: value });

  if (sectionKey === "problem_statement") {
    return (
      <textarea
        className="input min-h-[120px]"
        value={draft.problem_statement}
        onChange={(e) => update("problem_statement", e.target.value)}
      />
    );
  }

  if (sectionKey === "success_metrics") {
    return (
      <div>
        <p className="mb-1 text-xs text-slate-400">One metric per line.</p>
        <textarea
          className="input min-h-[120px]"
          value={listToLines(draft.success_metrics)}
          onChange={(e) => update("success_metrics", linesToList(e.target.value))}
        />
      </div>
    );
  }

  if (sectionKey === "risks_and_assumptions") {
    return (
      <div>
        <p className="mb-1 text-xs text-slate-400">One risk or assumption per line.</p>
        <textarea
          className="input min-h-[120px]"
          value={listToLines(draft.risks_and_assumptions)}
          onChange={(e) => update("risks_and_assumptions", linesToList(e.target.value))}
        />
      </div>
    );
  }

  if (sectionKey === "scope") {
    // scope is an object { in_scope: [], out_of_scope: [] } — edit each list separately.
    const setScope = (key, value) =>
      update("scope", { ...draft.scope, [key]: linesToList(value) });
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">In scope (one per line)</label>
          <textarea
            className="input min-h-[120px]"
            value={listToLines(draft.scope.in_scope)}
            onChange={(e) => setScope("in_scope", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Out of scope (one per line)</label>
          <textarea
            className="input min-h-[120px]"
            value={listToLines(draft.scope.out_of_scope)}
            onChange={(e) => setScope("out_of_scope", e.target.value)}
          />
        </div>
      </div>
    );
  }

  if (sectionKey === "personas") {
    // Personas are nested objects, so each one gets its own mini-form plus add/remove.
    const setPersona = (index, patch) => {
      const next = draft.personas.map((p, i) => (i === index ? { ...p, ...patch } : p));
      update("personas", next);
    };
    const addPersona = () =>
      update("personas", [
        ...draft.personas,
        { name: "", description: "", pain_points: [] },
      ]);
    const removePersona = (index) =>
      update("personas", draft.personas.filter((_, i) => i !== index));

    return (
      <div className="space-y-4">
        {draft.personas.map((persona, i) => (
          <div key={i} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <div className="mb-2 flex items-center justify-between">
              <label className="label mb-0">Persona {i + 1}</label>
              <Button variant="ghost" onClick={() => removePersona(i)}>
                Remove
              </Button>
            </div>
            <input
              className="input mb-2"
              placeholder="Name"
              value={persona.name}
              onChange={(e) => setPersona(i, { name: e.target.value })}
            />
            <textarea
              className="input mb-2"
              placeholder="Description"
              value={persona.description}
              onChange={(e) => setPersona(i, { description: e.target.value })}
            />
            <label className="label">Pain points (one per line)</label>
            <textarea
              className="input"
              value={listToLines(persona.pain_points)}
              onChange={(e) => setPersona(i, { pain_points: linesToList(e.target.value) })}
            />
          </div>
        ))}
        <Button variant="secondary" onClick={addPersona}>
          + Add persona
        </Button>
      </div>
    );
  }

  return null;
}

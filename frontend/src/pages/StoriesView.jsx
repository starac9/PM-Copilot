// The Stories tab: generate epics + user stories from the PRD, edit RICE inputs live, and
// save. RICE scores recompute in the browser (see utils/rice.js) so editing feels instant.
//
// The saved story set is cached via React Query (useStories). While editing we keep a local
// draft so keystrokes don't touch the cache; only Save PUTs the whole set back to the server.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, RefreshCw, Save, Sparkles } from "lucide-react";

import { apiErrorMessage } from "../api/client.js";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import EpicColumn from "../components/EpicColumn.jsx";
import { SectionHeader } from "../components/PageHeader.jsx";
import ProjectHeader from "../components/ProjectHeader.jsx";
import { StoriesSkeleton } from "../components/Skeleton.jsx";
import {
  useGenerateStories,
  useSaveStories,
  useStories,
} from "../hooks/useStories.js";
import { useToast } from "../lib/toast.js";

export default function StoriesView() {
  const { projectId } = useParams();
  const toast = useToast();

  const { data: saved, isLoading, isError, error } = useStories(projectId);
  const generateStories = useGenerateStories(projectId);
  const saveStories = useSaveStories(projectId);

  // Local editable draft, seeded from the cached story set. We keep our own copy so live
  // RICE edits are instant and only persisted on Save.
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);

  // When the cached data loads or changes (generate/save), reset the draft to match it.
  useEffect(() => {
    setDraft(saved ?? null);
    setDirty(false);
  }, [saved]);

  // Warn before a tab close/reload throws away unsaved RICE edits.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function handleGenerate() {
    if (dirty && !window.confirm("Regenerating will discard your unsaved edits. Continue?")) return;
    try {
      await generateStories.mutateAsync();
      toast.success("Stories generated.");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not generate stories."));
    }
  }

  // Update one story within one epic, immutably, and mark the set as dirty.
  function handleStoryChange(epicIndex, storyIndex, updated) {
    setDraft((prev) => {
      const epics = prev.epics.map((epic, ei) => {
        if (ei !== epicIndex) return epic;
        const stories = epic.stories.map((s, si) => (si === storyIndex ? updated : s));
        return { ...epic, stories };
      });
      return { ...prev, epics };
    });
    setDirty(true);
  }

  async function handleSave() {
    // RICE inputs may be raw strings while editing (see StoryCard); send clean numbers.
    const toNumber = (v) => Math.max(0, Number(v) || 0);
    const content = {
      ...draft,
      epics: draft.epics.map((epic) => ({
        ...epic,
        stories: epic.stories.map((s) => ({
          ...s,
          reach: toNumber(s.reach),
          impact: toNumber(s.impact),
          confidence: Math.min(100, toNumber(s.confidence)),
          effort: toNumber(s.effort),
        })),
      })),
    };
    try {
      await saveStories.mutateAsync(content);
      setDirty(false);
      toast.success("Saved.");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save."));
    }
  }

  const storyCount = draft?.epics.reduce((n, e) => n + e.stories.length, 0) ?? 0;

  return (
    <div className="space-y-8">
      <ProjectHeader projectId={projectId} />

      <section className="space-y-5">
        <SectionHeader
          title="User stories"
          description={
            draft
              ? `${draft.epics.length} epics · ${storyCount} stories · sorted by RICE score — tune the inputs and the order updates live.`
              : "Epics and stories with acceptance criteria and suggested RICE inputs."
          }
          actions={
            draft && (
              <>
                <Button variant="secondary" loading={generateStories.isPending} onClick={handleGenerate}>
                  {!generateStories.isPending && <RefreshCw size={15} />} Regenerate
                </Button>
                <Button loading={saveStories.isPending} disabled={!dirty} onClick={handleSave}>
                  {!saveStories.isPending && <Save size={15} />}
                  {dirty ? "Save changes" : "Saved"}
                </Button>
              </>
            )
          }
        />

        {isLoading ? (
          <StoriesSkeleton />
        ) : isError ? (
          <EmptyState
            icon={AlertTriangle}
            title="Couldn't load stories"
            description={apiErrorMessage(error, "Please try again in a moment.")}
          />
        ) : draft ? (
          <div className="grid gap-8 md:grid-cols-2">
            {draft.epics.map((epic, epicIndex) => (
              <EpicColumn
                key={epicIndex}
                epic={epic}
                onStoryChange={(storyIndex, updated) =>
                  handleStoryChange(epicIndex, storyIndex, updated)
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No stories yet"
            description="Generate epics and user stories from this project's PRD (generate the PRD first)."
            action={
              <Button loading={generateStories.isPending} onClick={handleGenerate}>
                {!generateStories.isPending && <Sparkles size={15} />}
                {generateStories.isPending ? "Generating…" : "Generate stories"}
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}

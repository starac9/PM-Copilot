// The Stories tab: generate epics + user stories from the PRD, edit RICE inputs live, and
// save. RICE scores recompute in the browser (see utils/rice.js) so editing feels instant.
//
// The saved story set is cached via React Query (useStories). While editing we keep a local
// draft so keystrokes don't touch the cache; only Save PUTs the whole set back to the server.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { apiErrorMessage } from "../api/client.js";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import EpicColumn from "../components/EpicColumn.jsx";
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

  const { data: saved, isLoading } = useStories(projectId);
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

  async function handleGenerate() {
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
    try {
      await saveStories.mutateAsync(draft);
      setDirty(false);
      toast.success("Saved.");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save."));
    }
  }

  return (
    <div className="space-y-6">
      <ProjectHeader projectId={projectId} />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-heading">User stories</h2>
        {draft && (
          <div className="flex gap-2">
            <Button variant="secondary" loading={generateStories.isPending} onClick={handleGenerate}>
              Regenerate
            </Button>
            <Button loading={saveStories.isPending} disabled={!dirty} onClick={handleSave}>
              {dirty ? "Save changes" : "Saved"}
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <StoriesSkeleton />
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
          description="Generate epics and user stories from this project's PRD."
          action={
            <Button loading={generateStories.isPending} onClick={handleGenerate}>
              Generate stories
            </Button>
          }
        />
      )}
    </div>
  );
}

// The Roadmap tab: the user enters a team capacity (story points per sprint) and we ask
// the backend to arrange the saved stories into sprints. The arrangement is computed
// deterministically on the server (RICE ranking + greedy capacity packing) — not by the
// LLM — so it's reproducible and explainable.
//
// The result isn't persisted, so it lives in the mutation state (useBuildRoadmap) rather
// than a cached query.
import { useState } from "react";
import { useParams } from "react-router-dom";

import { apiErrorMessage } from "../api/client.js";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ProjectHeader from "../components/ProjectHeader.jsx";
import SprintColumn from "../components/SprintColumn.jsx";
import { useBuildRoadmap } from "../hooks/useStories.js";
import { useToast } from "../lib/toast.js";

export default function RoadmapView() {
  const { projectId } = useParams();
  const [capacity, setCapacity] = useState(8);
  const toast = useToast();

  const buildRoadmap = useBuildRoadmap(projectId);
  const roadmap = buildRoadmap.data;

  async function handleBuild() {
    try {
      await buildRoadmap.mutateAsync(capacity);
    } catch (err) {
      // 404 here means "no stories yet" — nudge the user to the Stories tab.
      if (err.response?.status === 404) {
        toast.error("Generate stories first, then build a roadmap.");
      } else {
        toast.error(apiErrorMessage(err, "Could not build the roadmap."));
      }
    }
  }

  return (
    <div className="space-y-6">
      <ProjectHeader projectId={projectId} />

      <div className="card flex flex-wrap items-end gap-4 p-5">
        <div>
          <label className="label" htmlFor="capacity">
            Team capacity (story points per sprint)
          </label>
          <input
            id="capacity"
            type="number"
            min="1"
            step="any"
            className="input w-56"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>
        <Button loading={buildRoadmap.isPending} onClick={handleBuild}>
          Build roadmap
        </Button>
      </div>

      {roadmap ? (
        // Horizontal scroll of sprint columns, like a simple kanban/timeline.
        <div className="flex gap-4 overflow-x-auto pb-2">
          {roadmap.sprints.map((sprint) => (
            <SprintColumn key={sprint.number} sprint={sprint} capacity={roadmap.capacity} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No roadmap yet"
          description="Set a capacity and build a sprint plan from your prioritized stories."
        />
      )}
    </div>
  );
}

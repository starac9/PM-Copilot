// The Roadmap tab: the user enters a team capacity (story points per sprint) and we ask
// the backend to arrange the saved stories into sprints. The arrangement is computed
// deterministically on the server (RICE ranking + greedy capacity packing) — not by the
// LLM — so it's reproducible and explainable.
//
// The result isn't persisted, so it lives in the mutation state (useBuildRoadmap) rather
// than a cached query.
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Route } from "lucide-react";

import { apiErrorMessage } from "../api/client.js";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { SectionHeader } from "../components/PageHeader.jsx";
import ProjectHeader from "../components/ProjectHeader.jsx";
import SprintColumn from "../components/SprintColumn.jsx";
import { useBuildRoadmap } from "../hooks/useStories.js";
import { useToast } from "../lib/toast.js";

// One labelled figure in the summary strip above the sprints.
function Stat({ label, value }) {
  return (
    <div className="px-5 py-4">
      <div className="eyebrow">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-heading">{value}</div>
    </div>
  );
}

export default function RoadmapView() {
  const { projectId } = useParams();
  const [capacity, setCapacity] = useState("8");
  const toast = useToast();

  const buildRoadmap = useBuildRoadmap(projectId);
  const roadmap = buildRoadmap.data;
  const capacityValid = Number(capacity) > 0;

  async function handleBuild(event) {
    event.preventDefault();
    if (!capacityValid) return;
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

  const totalPoints = roadmap?.sprints.reduce((n, s) => n + s.total_effort, 0) ?? 0;
  const totalStories = roadmap?.sprints.reduce((n, s) => n + s.stories.length, 0) ?? 0;

  return (
    <div className="space-y-8">
      <ProjectHeader projectId={projectId} />

      <section className="space-y-5">
        <SectionHeader
          title="Sprint roadmap"
          description="Stories ranked by RICE and packed into sprints that fit your team's capacity. Deterministic — no AI guesswork."
        />

        <form onSubmit={handleBuild} className="card flex flex-wrap items-end gap-4 p-5">
          <div>
            <label className="label" htmlFor="capacity">
              Team capacity <span className="font-normal text-muted">(story points / sprint)</span>
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
            {!capacityValid && <p className="field-error">Enter a capacity greater than 0.</p>}
          </div>
          <Button type="submit" loading={buildRoadmap.isPending} disabled={!capacityValid}>
            {!buildRoadmap.isPending && <Route size={15} />}
            {roadmap ? "Rebuild roadmap" : "Build roadmap"}
          </Button>
        </form>

        {roadmap ? (
          <>
            <div className="card grid grid-cols-3 divide-x divide-dashed divide-slate-200 dark:divide-slate-800">
              <Stat label="Sprints" value={roadmap.sprints.length} />
              <Stat label="Stories" value={totalStories} />
              <Stat label="Points" value={Number(totalPoints.toFixed(1))} />
            </div>
            {/* Horizontal scroll of sprint columns, like a simple kanban/timeline. */}
            <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {roadmap.sprints.map((sprint) => (
                <SprintColumn key={sprint.number} sprint={sprint} capacity={roadmap.capacity} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={Route}
            title="No roadmap yet"
            description="Set a capacity and build a sprint plan from your prioritized stories."
          />
        )}
      </section>
    </div>
  );
}

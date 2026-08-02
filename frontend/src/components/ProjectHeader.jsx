// Shared header for the three project pages (PRD / Stories / Roadmap): a back link, the
// project title/description, and the tab nav. It reads the project from the shared React
// Query cache (useProject) so switching tabs doesn't refetch it. Keeps the pages focused
// on their own content.
import { Link } from "react-router-dom";

import { useProject } from "../hooks/useProjects.js";
import ExportMenu from "./ExportMenu.jsx";
import { Skeleton } from "./Skeleton.jsx";
import ProjectTabs from "./ProjectTabs.jsx";

export default function ProjectHeader({ projectId }) {
  const { data: project, isLoading } = useProject(projectId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/dashboard"
            className="text-sm font-medium text-muted transition hover:text-brand-500"
          >
            ← Back to projects
          </Link>
          {isLoading ? (
            <div className="mt-2 space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-80" />
            </div>
          ) : (
            <>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-heading">
                {project?.title || "Project"}
              </h1>
              {project?.description && (
                <p className="mt-1 max-w-2xl text-sm text-muted">{project.description}</p>
              )}
            </>
          )}
        </div>
        {/* Export is available from every tab; the API 404s cleanly if there's nothing yet. */}
        <ExportMenu projectId={projectId} />
      </div>
      <ProjectTabs projectId={projectId} />
    </div>
  );
}

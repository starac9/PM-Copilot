// Shared header for the project pages (PRD / Stories / Roadmap / Workspace): a back link,
// the project title/description, export actions, and the tab nav. It reads the project from
// the shared React Query cache (useProject) so switching tabs doesn't refetch it. Keeps the
// pages focused on their own content.
import { Link } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";

import { useProject } from "../hooks/useProjects.js";
import ExportMenu from "./ExportMenu.jsx";
import { Eyebrow } from "./PageHeader.jsx";
import { Skeleton } from "./Skeleton.jsx";
import ProjectTabs from "./ProjectTabs.jsx";

export default function ProjectHeader({ projectId }) {
  const { data: project, isLoading, isError } = useProject(projectId);

  return (
    <div className="space-y-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-grass-600 dark:hover:text-grass-400"
      >
        <ArrowLeft size={15} /> All projects
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Eyebrow>Project</Eyebrow>
          {isLoading ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-4 w-80" />
            </div>
          ) : (
            <>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
                {project?.title || (isError ? "Project not found" : "Project")}
              </h1>
              {project?.description && (
                <p className="mt-2 max-w-2xl text-sm text-muted">{project.description}</p>
              )}
              {project?.target_audience && (
                <p className="mt-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  <Users size={12} /> {project.target_audience}
                </p>
              )}
            </>
          )}
        </div>
        {/* Export is available from every tab; the API 404s cleanly if there's nothing yet. */}
        <ExportMenu projectId={projectId} />
      </div>

      <div className="rule pt-6">
        <ProjectTabs projectId={projectId} />
      </div>
    </div>
  );
}

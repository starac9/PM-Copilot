// The project dashboard: the first thing a logged-in user sees. It lists their projects
// and lets them create or delete one. Opening a project navigates to /projects/:id.
//
// Data comes from React Query hooks (useProjects/useCreateProject/useDeleteProject), so the
// list is cached — returning to this page shows instantly while refetching in the background.
//
// This page is rendered INSIDE ProtectedRoute, which already provides the platform nav and the
// centered page container — so here we only render the page's own content.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, FileText, Plus, Trash2 } from "lucide-react";

import { apiErrorMessage } from "../api/client.js";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import ProjectForm from "../components/ProjectForm.jsx";
import { ProjectGridSkeleton } from "../components/Skeleton.jsx";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
} from "../hooks/useProjects.js";
import { useToast } from "../lib/toast.js";

const dateFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });

export default function Dashboard() {
  const [creating, setCreating] = useState(false); // is the "new project" form open?
  const toast = useToast();
  const navigate = useNavigate();

  const { data: projects = [], isLoading, isError, error } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  async function handleCreate(payload) {
    try {
      const project = await createProject.mutateAsync(payload);
      toast.success("Project created.");
      // Jump straight into the new project so the user can generate its PRD.
      navigate(`/projects/${project.id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not create project."));
    }
  }

  async function handleDelete(project) {
    // A destructive action, so confirm first. (Deleting a project cascades to its PRD.)
    if (!window.confirm(`Delete "${project.title}"? This can't be undone.`)) return;
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success("Project deleted.");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not delete project."));
    }
  }

  const withPrd = projects.filter((p) => p.has_prd).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title="Your projects"
        description="Turn a product idea into a full PRD, backlog, and roadmap."
        actions={
          !creating && (
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} strokeWidth={2.5} /> New project
            </Button>
          )
        }
      >
        {projects.length > 0 && (
          <p className="mt-4 flex items-center gap-4 font-mono text-[11px] uppercase tracking-wider text-slate-400">
            <span>{projects.length} project{projects.length === 1 ? "" : "s"}</span>
            <span className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-grass-500" />
              {withPrd} with PRD
            </span>
          </p>
        )}
      </PageHeader>

      {/* The create form appears in place, above the list. */}
      {creating && (
        <ProjectForm
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          submitting={createProject.isPending}
        />
      )}

      {isLoading ? (
        <ProjectGridSkeleton />
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load your projects"
          description={apiErrorMessage(error, "Please try again.")}
        />
      ) : projects.length === 0 ? (
        !creating && (
          <EmptyState
            title="No projects yet"
            description="Create your first project to generate a PRD with AI."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus size={16} strokeWidth={2.5} /> Create a project
              </Button>
            }
          />
        )
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            // The card is a positioned container: a full-size Link covers it, and the delete
            // button sits above that link — so we never nest one interactive element in another.
            <div key={project.id} className="card card-hover group relative flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="logo-mark h-10 w-10">
                  <FileText size={18} strokeWidth={1.75} />
                </span>
                {/* has_prd is computed by the backend so we can badge it without an extra call. */}
                {project.has_prd ? (
                  <span className="badge badge-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-grass-500" /> PRD ready
                  </span>
                ) : (
                  <span className="badge badge-neutral">Draft</span>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-heading">
                  <Link
                    to={`/projects/${project.id}`}
                    className="after:absolute after:inset-0 after:rounded-xl focus:outline-none"
                  >
                    {project.title}
                  </Link>
                </h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{project.description}</p>
              </div>
              <div className="rule mt-auto flex items-center justify-between pt-3">
                <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  {dateFormat.format(new Date(project.created_at))}
                </span>
                <span className="flex items-center gap-1">
                  <Button
                    variant="ghost-danger"
                    size="sm"
                    className="relative z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                    aria-label={`Delete ${project.title}`}
                    onClick={() => handleDelete(project)}
                  >
                    <Trash2 size={14} />
                  </Button>
                  <ArrowRight
                    size={16}
                    className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-grass-500 dark:text-slate-600"
                  />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// The project dashboard: the first thing a logged-in user sees. It lists their projects
// and lets them create or delete one. Opening a project navigates to /projects/:id.
//
// Data comes from React Query hooks (useProjects/useCreateProject/useDeleteProject), so the
// list is cached — returning to this page shows instantly while refetching in the background.
//
// This page is rendered INSIDE ProtectedRoute, which already provides the Navbar and the
// centered page container — so here we only render the page's own content.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, FileText, Plus } from "lucide-react";

import { apiErrorMessage } from "../api/client.js";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ProjectForm from "../components/ProjectForm.jsx";
import { ProjectGridSkeleton } from "../components/Skeleton.jsx";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
} from "../hooks/useProjects.js";
import { useToast } from "../lib/toast.js";

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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-heading">Your projects</h1>
          <p className="mt-1 text-sm text-muted">
            Turn a product idea into a full PRD, backlog, and roadmap.
          </p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={2.5} /> New project
          </Button>
        )}
      </div>

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
      ) : projects.length === 0 && !creating ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to generate a PRD with AI."
          action={<Button onClick={() => setCreating(true)}>Create a project</Button>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="card card-hover group flex flex-col gap-3 p-5 text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="logo-mark h-10 w-10">
                  <FileText size={18} strokeWidth={1.75} />
                </span>
                {/* has_prd is computed by the backend so we can badge it without an extra call. */}
                {project.has_prd ? (
                  <span className="badge bg-grass-100 text-grass-700 dark:bg-grass-500/10 dark:text-grass-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-grass-500" /> PRD ready
                  </span>
                ) : (
                  <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    Draft
                  </span>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-heading group-hover:text-brand-600 dark:group-hover:text-brand-400">
                  {project.title}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{project.description}</p>
              </div>
              <div className="mt-auto flex items-center justify-between pt-2">
                <span className="text-sm font-medium text-brand-600 group-hover:translate-x-0.5 group-hover:transition">
                  Open →
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(project);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      handleDelete(project);
                    }
                  }}
                  className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  Delete
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

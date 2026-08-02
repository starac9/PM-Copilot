// The PM Workspace tab: the "everything else a PM does" surface. It lists every artifact
// type the backend can generate (strategy, market analysis, OKRs, personas, GTM, release
// notes, stakeholder updates, discovery) and lets the user generate, view, edit, regenerate,
// or delete each — all grounded in the project's idea, PRD, and uploaded docs.
import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertTriangle,
  ClipboardList,
  Compass,
  FileText,
  Megaphone,
  Rocket,
  Search,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import { apiErrorMessage } from "../api/client.js";
import ArtifactModal from "../components/ArtifactModal.jsx";
import Button from "../components/Button.jsx";
import ProjectHeader from "../components/ProjectHeader.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import { useGenerateArtifact, useWorkspace } from "../hooks/useArtifacts.js";
import { useToast } from "../lib/toast.js";

// Maps each artifact type to a line icon (the label/description come from the backend catalog).
const ICONS = {
  discovery: Search,
  strategy: Compass,
  market: TrendingUp,
  okrs: Target,
  personas: Users,
  gtm: Rocket,
  release_notes: Megaphone,
  stakeholder_update: ClipboardList,
};

export default function WorkspaceView() {
  const { projectId } = useParams();
  const toast = useToast();
  const [openType, setOpenType] = useState(null);

  const { data, isLoading, isError, error } = useWorkspace(projectId);
  const generate = useGenerateArtifact(projectId);

  // Read defensively so a failed/empty query can never crash the page.
  const catalog = data?.catalog ?? [];
  // type -> summary, for the "already generated" state.
  const generatedMap = new Map((data?.generated ?? []).map((g) => [g.type, g]));

  async function handleGenerate(type) {
    try {
      await generate.mutateAsync(type);
      toast.success("Generated.");
      setOpenType(type); // open it so the user sees the result immediately
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not generate. Try again."));
    }
  }

  const openLabel = data?.catalog.find((c) => c.key === openType)?.label;

  return (
    <div className="space-y-6">
      <ProjectHeader projectId={projectId} />

      <div>
        <h2 className="text-lg font-semibold text-heading">PM workspace</h2>
        <p className="text-sm text-muted">
          Everything a PM produces — generated from your idea, PRD, and uploaded docs.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card space-y-3 p-5">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load the workspace"
          description={apiErrorMessage(error, "Please try again in a moment.")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((c) => {
            const Icon = ICONS[c.key] ?? FileText;
            const gen = generatedMap.get(c.key);
            const pending = generate.isPending && generate.variables === c.key;
            return (
              <div key={c.key} className="card flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between">
                  <span className="logo-mark h-10 w-10">
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  {gen && (
                    <span className="badge bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Ready
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-heading">{c.label}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {gen ? gen.summary : c.description}
                  </p>
                </div>
                <div className="mt-auto flex gap-2 pt-2">
                  {gen ? (
                    <>
                      <Button variant="secondary" onClick={() => setOpenType(c.key)}>
                        View
                      </Button>
                      <Button variant="ghost" loading={pending} onClick={() => handleGenerate(c.key)}>
                        Regenerate
                      </Button>
                    </>
                  ) : (
                    <Button loading={pending} onClick={() => handleGenerate(c.key)}>
                      Generate
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openType && (
        <ArtifactModal
          projectId={projectId}
          type={openType}
          label={openLabel}
          regenerating={generate.isPending && generate.variables === openType}
          onRegenerate={() => handleGenerate(openType)}
          onClose={() => setOpenType(null)}
        />
      )}
    </div>
  );
}

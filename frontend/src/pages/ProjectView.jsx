// The PRD tab of a project: generate + view + edit the PRD. If no PRD exists yet it
// offers a "Generate PRD" button; once generated it renders the editable PrdViewer.
//
// The PRD is loaded/cached via React Query (usePrd); generation is a mutation that also
// reports which uploaded docs grounded it (RAG). The project title/tabs come from ProjectHeader.
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Search } from "lucide-react";

import { apiErrorMessage } from "../api/client.js";
import Button from "../components/Button.jsx";
import DocumentUpload from "../components/DocumentUpload.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ProjectHeader from "../components/ProjectHeader.jsx";
import { PrdSkeleton } from "../components/Skeleton.jsx";
import PrdViewer from "../components/prd/PrdViewer.jsx";
import { useGeneratePrd, usePrd } from "../hooks/usePrd.js";
import { useToast } from "../lib/toast.js";

export default function ProjectView() {
  const { projectId } = useParams();
  const toast = useToast();
  // Filenames that grounded the last generation (from the X-Context-Documents header).
  const [contextDocs, setContextDocs] = useState([]);

  const { data: prd, isLoading } = usePrd(projectId);
  const generatePrd = useGeneratePrd(projectId);

  async function handleGenerate() {
    try {
      // Calls the AI on the backend, so it can take several seconds — the button shows a
      // spinner and is disabled while we wait (via generatePrd.isPending).
      const { contextDocs: used } = await generatePrd.mutateAsync();
      setContextDocs(used);
      toast.success("PRD generated.");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not generate the PRD."));
    }
  }

  return (
    <div className="space-y-6">
      <ProjectHeader projectId={projectId} />

      <DocumentUpload projectId={projectId} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-heading">Product Requirements Document</h2>
          {contextDocs.length > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400">
              <Search size={13} strokeWidth={2} />
              Grounded in {contextDocs.length} document
              {contextDocs.length > 1 ? "s" : ""}: {contextDocs.join(", ")}
            </p>
          )}
        </div>
        {prd && (
          <Button variant="secondary" loading={generatePrd.isPending} onClick={handleGenerate}>
            Regenerate
          </Button>
        )}
      </div>

      {isLoading ? (
        <PrdSkeleton />
      ) : prd ? (
        <PrdViewer projectId={projectId} content={prd} />
      ) : (
        <EmptyState
          title="No PRD yet"
          description="Generate a structured PRD from this idea using AI."
          action={
            <Button loading={generatePrd.isPending} onClick={handleGenerate}>
              Generate PRD
            </Button>
          }
        />
      )}
    </div>
  );
}

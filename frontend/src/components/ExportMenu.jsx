// Export actions for a project: download Markdown, download Jira CSV, and copy the PRD +
// stories as Markdown to the clipboard.
//
// WHY fetch-then-download instead of a plain <a href>: our API needs the JWT in the
// Authorization header, which a raw link can't send. So we request the file through the
// axios client (which attaches the token), then trigger a client-side download from the
// returned blob.
import { useState } from "react";

import api, { apiErrorMessage } from "../api/client.js";
import { useToast } from "../lib/toast.js";
import Button from "./Button.jsx";

export default function ExportMenu({ projectId }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  // Download a file returned by an authenticated GET (as a blob).
  async function download(path, filename) {
    setBusy(true);
    try {
      const res = await api.get(path, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Nothing to export yet."));
    } finally {
      setBusy(false);
    }
  }

  async function copyMarkdown() {
    setBusy(true);
    try {
      // Plain text response (no blob) so we can write it straight to the clipboard.
      const res = await api.get(`/projects/${projectId}/export/markdown`);
      await navigator.clipboard.writeText(res.data);
      toast.success("Copied Markdown to clipboard.");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not copy."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        loading={busy}
        onClick={() => download(`/projects/${projectId}/export/markdown`, "prd.md")}
      >
        Download .md
      </Button>
      <Button
        variant="secondary"
        loading={busy}
        onClick={() => download(`/projects/${projectId}/export/jira.csv`, "jira.csv")}
      >
        Jira CSV
      </Button>
      <Button variant="ghost" loading={busy} onClick={copyMarkdown}>
        Copy as Markdown
      </Button>
    </div>
  );
}

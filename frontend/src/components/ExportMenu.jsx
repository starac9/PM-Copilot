// Export actions for a project: download Markdown, download Jira CSV, and copy the PRD +
// stories as Markdown to the clipboard.
//
// WHY fetch-then-download instead of a plain <a href>: our API needs the JWT in the
// Authorization header, which a raw link can't send. So we request the file through the
// axios client (which attaches the token), then trigger a client-side download from the
// returned blob.
import { useState } from "react";
import { Copy, FileDown, Sheet } from "lucide-react";

import api, { apiErrorMessage } from "../api/client.js";
import { useToast } from "../lib/toast.js";
import Button from "./Button.jsx";

// Use the server's filename (slugged from the project title) when it sends one.
function filenameFrom(res, fallback) {
  const match = /filename="?([^"]+)"?/.exec(res.headers["content-disposition"] || "");
  return match ? match[1] : fallback;
}

// With responseType "blob", error bodies arrive as a Blob too — decode it so the toast can
// show the server's message ("Generate stories before exporting to Jira.").
async function readBlobError(err) {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      err.response.data = JSON.parse(await data.text());
    } catch {
      /* not JSON — keep the generic message */
    }
  }
  return err;
}

export default function ExportMenu({ projectId }) {
  const [busy, setBusy] = useState(null); // which action is running, or null
  const toast = useToast();

  // Download a file returned by an authenticated GET (as a blob).
  async function download(key, path, fallbackName) {
    setBusy(key);
    try {
      const res = await api.get(path, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameFrom(res, fallbackName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(apiErrorMessage(await readBlobError(err), "Nothing to export yet."));
    } finally {
      setBusy(null);
    }
  }

  async function copyMarkdown() {
    setBusy("copy");
    try {
      // Plain text response (no blob) so we can write it straight to the clipboard.
      const res = await api.get(`/projects/${projectId}/export/markdown`, {
        responseType: "text",
      });
      await navigator.clipboard.writeText(res.data);
      toast.success("Copied Markdown to clipboard.");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not copy."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        loading={busy === "md"}
        disabled={!!busy}
        onClick={() => download("md", `/projects/${projectId}/export/markdown`, "prd.md")}
      >
        {busy !== "md" && <FileDown size={15} />} Markdown
      </Button>
      <Button
        variant="secondary"
        loading={busy === "csv"}
        disabled={!!busy}
        onClick={() => download("csv", `/projects/${projectId}/export/jira.csv`, "jira.csv")}
      >
        {busy !== "csv" && <Sheet size={15} />} Jira CSV
      </Button>
      <Button
        variant="ghost"
        loading={busy === "copy"}
        disabled={!!busy}
        onClick={copyMarkdown}
        aria-label="Copy as Markdown"
        title="Copy as Markdown"
      >
        {busy !== "copy" && <Copy size={15} />}
        <span className="sm:hidden">Copy</span>
      </Button>
    </div>
  );
}

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "../ui/button";
import type { JobOsState } from "../../types/jobOs";
import { parseJobOsImport, serializeJobOsExport } from "../../services/jobOsTransfer";

interface JobOsTransferControlsProps {
  getExportState: () => JobOsState;
  onImportState: (state: JobOsState) => Promise<void>;
}

function downloadJson(fileName: string, content: string): void {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function JobOsTransferControls({
  getExportState,
  onImportState,
}: JobOsTransferControlsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  function handleExport(): void {
    const fileName = `jobsprint-export-${new Date().toISOString().slice(0, 10)}.json`;
    downloadJson(fileName, serializeJobOsExport(getExportState()));
    setStatus(`Exported Job OS state to ${fileName}.`);
  }

  async function handleImport(file: File): Promise<void> {
    setIsImporting(true);
    setStatus(null);

    try {
      const text = await file.text();
      const nextState = parseJobOsImport(text);
      const confirmed = window.confirm(
        "Replace the current Job OS state with the imported file? This overwrites the current Job OS snapshot."
      );

      if (!confirmed) {
        setStatus("Import cancelled.");
        return;
      }

      await onImportState(nextState);
      setStatus("Imported Job OS state successfully.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        Job OS transfer
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" />
          Export JSON
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={isImporting}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          {isImporting ? "Importing..." : "Import JSON"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            void handleImport(file);
          }}
        />
      </div>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
        Export downloads the full Job OS snapshot. Import replaces the current Job OS state after validation.
      </p>
      {status ? (
        <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">{status}</p>
      ) : null}
    </div>
  );
}

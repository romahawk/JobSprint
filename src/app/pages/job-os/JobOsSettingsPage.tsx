import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useApp } from "../../context";
import { useJobOs } from "../../hooks/useJobOs";
import { JobOsLayout } from "../../components/job-os/JobOsLayout";
import {
  downloadJsonFile,
  parseJobOsExport,
  serializeJobOs,
} from "../../services/jobOsExport";

export default function JobOsSettingsPage() {
  const { session } = useApp();
  const { companies, roles, applications, outreach, importAll, syncNotice } = useJobOs(
    session?.userId ?? null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function handleExport(): void {
    const json = serializeJobOs({ companies, roles, applications, outreach });
    downloadJsonFile("jobsprint-export.json", json);
    setNotice({
      type: "ok",
      text: `Exported ${companies.length} companies, ${roles.length} roles, ${applications.length} applications, ${outreach.length} outreach records.`,
    });
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    const text = await file.text();
    let parsed;
    try {
      parsed = parseJobOsExport(text);
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Import failed." });
      return;
    }

    setImporting(true);
    setNotice(null);
    try {
      await importAll({
        companies: parsed.companies,
        roles: parsed.roles,
        applications: parsed.applications,
        outreach: parsed.outreach,
      });
      setNotice({
        type: "ok",
        text: `Imported ${parsed.companies.length} companies, ${parsed.roles.length} roles, ${parsed.applications.length} applications, ${parsed.outreach.length} outreach records.`,
      });
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Import failed." });
    } finally {
      setImporting(false);
    }
  }

  return (
    <JobOsLayout title="Job OS Settings" subtitle="Data management and backup" notice={syncNotice}>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Data Backup &amp; Restore</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Export your Job OS pipeline (companies, roles, applications, outreach) as a JSON file
            you can store offline or import into another account. Asset blobs and CV profiles are
            not included — manage those in the Assets Vault.
          </p>

          <div className="rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            Import replaces the current pipeline with the contents of the file. This cannot be
            undone. Export a fresh backup first if you want to preserve the current state.
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export JSON
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              {importing ? "Importing…" : "Import JSON"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => void handleFileChange(e)}
            />
          </div>

          {notice && (
            <div
              className={`rounded-md border px-3 py-2 text-xs ${
                notice.type === "ok"
                  ? "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300"
                  : "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
              }`}
            >
              {notice.text}
            </div>
          )}
        </CardContent>
      </Card>
    </JobOsLayout>
  );
}

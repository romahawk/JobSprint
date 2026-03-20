import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  downloadJsonFile,
  parseJobOsExport,
  serializeJobOs,
} from "../../services/jobOsExport";
import type { JobOsApplication, JobOsCompany, JobOsOutreach, JobOsRole } from "../../types/jobOs";

interface DataManagementCardProps {
  companies: JobOsCompany[];
  roles: JobOsRole[];
  applications: JobOsApplication[];
  outreach: JobOsOutreach[];
  onImport: (data: {
    companies: JobOsCompany[];
    roles: JobOsRole[];
    applications: JobOsApplication[];
    outreach: JobOsOutreach[];
  }) => Promise<void>;
}

export function DataManagementCard({
  companies,
  roles,
  applications,
  outreach,
  onImport,
}: DataManagementCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [importing, setImporting] = useState(false);

  function handleExport(): void {
    const json = serializeJobOs({ companies, roles, applications, outreach });
    downloadJsonFile("jobsprint-export.json", json);
    setNotice({ type: "ok", text: `Exported ${companies.length} companies, ${roles.length} roles, ${applications.length} applications, ${outreach.length} outreach records.` });
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-selected
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
      await onImport({
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
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Data Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Export your Job OS data (companies, roles, applications, outreach) as a JSON backup.
          Import merges the file into your current data; assets and CV profiles are not included.
        </p>

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
  );
}

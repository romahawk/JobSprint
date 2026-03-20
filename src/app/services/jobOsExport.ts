import type {
  JobOsApplication,
  JobOsCompany,
  JobOsOutreach,
  JobOsRole,
} from "../types/jobOs";

export const EXPORT_SCHEMA_VERSION = "1";

/**
 * The subset of Job OS state included in an export file.
 * Assets (CVs, scripts, templates) are excluded — they contain large blobs
 * and are managed separately via the Assets Vault.
 */
export interface JobOsExportFile {
  schemaVersion: string;
  exportedAt: string;
  companies: JobOsCompany[];
  roles: JobOsRole[];
  applications: JobOsApplication[];
  outreach: JobOsOutreach[];
}

export function serializeJobOs(data: {
  companies: JobOsCompany[];
  roles: JobOsRole[];
  applications: JobOsApplication[];
  outreach: JobOsOutreach[];
}): string {
  const file: JobOsExportFile = {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    companies: data.companies,
    roles: data.roles,
    applications: data.applications,
    outreach: data.outreach,
  };
  return JSON.stringify(file, null, 2);
}

export function parseJobOsExport(json: string): JobOsExportFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON: the file could not be parsed.");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Invalid export file: expected a JSON object at the top level.");
  }

  const file = parsed as Record<string, unknown>;

  if (file.schemaVersion !== EXPORT_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported schema version: "${String(file.schemaVersion ?? "missing")}". Expected "${EXPORT_SCHEMA_VERSION}".`
    );
  }

  for (const key of ["companies", "roles", "applications", "outreach"] as const) {
    if (!Array.isArray(file[key])) {
      throw new Error(`Invalid export file: "${key}" must be an array.`);
    }
  }

  return file as unknown as JobOsExportFile;
}

export function downloadJsonFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

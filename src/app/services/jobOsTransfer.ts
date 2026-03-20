import type { JobOsState } from "../types/jobOs";
import { normalizeJobOsState } from "./jobOsState";

export const JOB_OS_EXPORT_KIND = "jobsprint.job-os.export";
export const JOB_OS_EXPORT_VERSION = 1;

export interface JobOsExportEnvelope {
  kind: typeof JOB_OS_EXPORT_KIND;
  version: typeof JOB_OS_EXPORT_VERSION;
  exportedAt: string;
  state: JobOsState;
}

export function createJobOsExportEnvelope(state: JobOsState): JobOsExportEnvelope {
  return {
    kind: JOB_OS_EXPORT_KIND,
    version: JOB_OS_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    state: normalizeJobOsState(state),
  };
}

export function serializeJobOsExport(state: JobOsState): string {
  return JSON.stringify(createJobOsExportEnvelope(state), null, 2);
}

export function parseJobOsImport(text: string): JobOsState {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Import file is not valid JSON.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Import file must contain a Job OS export object.");
  }

  const envelope = parsed as Partial<JobOsExportEnvelope>;

  if (envelope.kind !== JOB_OS_EXPORT_KIND) {
    throw new Error("Import file is not a JobSprint Job OS export.");
  }

  if (envelope.version !== JOB_OS_EXPORT_VERSION) {
    throw new Error(`Import version ${String(envelope.version ?? "unknown")} is not supported.`);
  }

  if (!("state" in envelope)) {
    throw new Error("Import file is missing the Job OS state payload.");
  }

  return normalizeJobOsState(envelope.state);
}

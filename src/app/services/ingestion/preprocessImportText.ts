import type { AiImportRawExtractedFields } from "../../types/jobOs";

const DEFAULT_MAX_CHARS = 600;
const LONG_TEXT_MAX_CHARS = 12000;

export function preprocessImportText(
  value: string | undefined,
  options?: { maxChars?: number }
): string | undefined {
  if (typeof value !== "string") return undefined;

  const normalized = value
    .normalize("NFKC")
    .replace(/\u00A0/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!normalized) return undefined;

  const maxChars = options?.maxChars ?? DEFAULT_MAX_CHARS;
  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

export function preprocessImportExtractedFields(
  fields: AiImportRawExtractedFields
): AiImportRawExtractedFields {
  return {
    companyName: preprocessImportText(fields.companyName),
    website: preprocessImportText(fields.website),
    careersUrl: preprocessImportText(fields.careersUrl),
    industryHint: preprocessImportText(fields.industryHint),
    sizeHint: preprocessImportText(fields.sizeHint),
    locationHint: preprocessImportText(fields.locationHint),
    remotePolicyHint: preprocessImportText(fields.remotePolicyHint),
    englishFirstHint: preprocessImportText(fields.englishFirstHint),
    roleTitle: preprocessImportText(fields.roleTitle),
    roleUrl: preprocessImportText(fields.roleUrl),
    roleLocation: preprocessImportText(fields.roleLocation),
    seniorityHint: preprocessImportText(fields.seniorityHint),
    jobDescription: preprocessImportText(fields.jobDescription, {
      maxChars: LONG_TEXT_MAX_CHARS,
    }),
    notes: preprocessImportText(fields.notes, {
      maxChars: 2000,
    }),
  };
}

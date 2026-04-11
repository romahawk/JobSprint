import type {
  JobImportEnrichmentRequest,
  JobImportEnrichmentResponse,
  NormalizedImportResult,
  ParsedImportResult,
} from "./types";
import { preprocessImportExtractedFields, preprocessImportText } from "./preprocessImportText";

const FALLBACK_FIELD_KEYS = [
  "canonicalTitle",
  "roleTrack",
  "seniority",
  "industry",
  "companyStage",
  "companySizeBand",
  "workplaceMode",
  "fitScore",
  "priorityBand",
  "nextBestAction",
] as const;

function remoteBaseUrl(): string {
  return (import.meta.env.VITE_JSPRINT_REMOTE_API_URL || "").trim();
}

export function isRemoteJobImportEnrichmentEnabled(): boolean {
  return Boolean(remoteBaseUrl());
}

export function buildJobImportEnrichmentRequest(input: {
  parsed: ParsedImportResult;
  normalized?: NormalizedImportResult;
  sourceUrl?: string;
}): JobImportEnrichmentRequest {
  const { parsed, normalized, sourceUrl } = input;

  return {
    sourceUrl,
    sourcePlatform: parsed.sourcePlatform,
    sourceType: parsed.sourceType,
    importConfidence: parsed.confidence,
    rawExtracted: preprocessImportExtractedFields(parsed.extracted),
    normalized: normalized
      ? {
          company: {
            name: preprocessImportText(normalized.company.name),
            industry: preprocessImportText(normalized.company.industry),
            size: preprocessImportText(normalized.company.size),
            remotePolicy: preprocessImportText(normalized.company.remotePolicy),
            location: preprocessImportText(normalized.company.location),
            englishFirst: preprocessImportText(normalized.company.englishFirst),
          },
          role: normalized.role
            ? {
                title: preprocessImportText(normalized.role.title),
                url: preprocessImportText(normalized.role.url),
                location: preprocessImportText(normalized.role.location),
                seniority: preprocessImportText(normalized.role.seniority),
                track: preprocessImportText(normalized.role.track),
                fitScore: normalized.role.fitScore,
                status: preprocessImportText(normalized.role.status),
                nextAction: preprocessImportText(normalized.role.nextAction),
              }
            : undefined,
        }
      : undefined,
  };
}

export async function requestRemoteJobImportEnrichment(input: {
  parsed: ParsedImportResult;
  normalized?: NormalizedImportResult;
  sourceUrl?: string;
}): Promise<JobImportEnrichmentResponse | null> {
  const baseUrl = remoteBaseUrl();
  if (!baseUrl) {
    return null;
  }

  try {
    const payload = buildJobImportEnrichmentRequest(input);
    const response = await fetch(`${baseUrl}/job-import-enrich`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn("Remote job import enrichment failed", response.status);
      return null;
    }

    const data = await response.json();
    return coerceJobImportEnrichmentResponse(data);
  } catch (error) {
    console.warn("Remote job import enrichment unavailable", error);
    return null;
  }
}

function coerceJobImportEnrichmentResponse(value: unknown): JobImportEnrichmentResponse | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Record<string, unknown>;
  if (data.schemaVersion !== "ai_import_v1") {
    return null;
  }

  const confidenceFields = asRecord(data.confidence);
  const fieldConfidence = asRecord(confidenceFields?.fields);
  const overallConfidence = asConfidenceField(confidenceFields?.overall);

  if (!overallConfidence) {
    return null;
  }

  const fields = Object.fromEntries(
    FALLBACK_FIELD_KEYS.map((key) => [key, asConfidenceField(fieldConfidence?.[key])])
  ) as JobImportEnrichmentResponse["confidence"]["fields"];

  return {
    schemaVersion: "ai_import_v1",
    canonicalTitle: asString(data.canonicalTitle) ?? "Unknown",
    roleTrack: (asString(data.roleTrack) as JobImportEnrichmentResponse["roleTrack"]) ?? "Unknown",
    seniority: (asString(data.seniority) as JobImportEnrichmentResponse["seniority"]) ?? "Unknown",
    industry: (asString(data.industry) as JobImportEnrichmentResponse["industry"]) ?? "Unknown",
    companyStage:
      (asString(data.companyStage) as JobImportEnrichmentResponse["companyStage"]) ?? "Unknown",
    companySizeBand:
      (asString(data.companySizeBand) as JobImportEnrichmentResponse["companySizeBand"]) ?? "Unknown",
    workplaceMode:
      (asString(data.workplaceMode) as JobImportEnrichmentResponse["workplaceMode"]) ?? "Unknown",
    fitScore: asFitScore(data.fitScore) ?? 3,
    priorityBand:
      (asString(data.priorityBand) as JobImportEnrichmentResponse["priorityBand"]) ?? "Unknown",
    nextBestAction:
      (asString(data.nextBestAction) as JobImportEnrichmentResponse["nextBestAction"]) ??
      "Research",
    confidence: {
      overall: overallConfidence,
      fields,
    },
    reviewFlags: Array.isArray(data.reviewFlags)
      ? data.reviewFlags.filter(isReviewFlag)
      : [],
    model: asString(data.model) ?? "remote",
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asFitScore(value: unknown): 1 | 2 | 3 | 4 | 5 | undefined {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
    ? value
    : undefined;
}

function asConfidenceField(value: unknown) {
  const record = asRecord(value);
  const score = record && typeof record.score === "number" ? record.score : undefined;
  const level = record && asString(record.level);
  const source = record && asString(record.source);

  if (score == null || !level || !source) {
    return undefined;
  }

  return {
    score,
    level,
    evidence: Array.isArray(record.evidence)
      ? record.evidence.filter((item): item is string => typeof item === "string")
      : [],
    source,
  };
}

function isReviewFlag(value: unknown): value is JobImportEnrichmentResponse["reviewFlags"][number] {
  const record = asRecord(value);
  return Boolean(
    record &&
      asString(record.code) &&
      asString(record.severity) &&
      asString(record.message) &&
      typeof record.fieldPath === "string"
  );
}

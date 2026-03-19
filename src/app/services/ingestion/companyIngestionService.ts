import type {
  ParseInput,
  ParsedImportResult,
  NormalizedImportResult,
  NormalizedCompanyDraft,
  NormalizedRoleDraft,
  SourceAdapter,
} from "./types";
import { greenhouseAdapter } from "./sourceAdapters/greenhouseAdapter";
import { leverAdapter } from "./sourceAdapters/leverAdapter";
import { ashbyAdapter } from "./sourceAdapters/ashbyAdapter";
import { himalayasAdapter } from "./sourceAdapters/himalayasAdapter";
import { linkedInAdapter } from "./sourceAdapters/linkedInAdapter";
import { genericAdapter } from "./sourceAdapters/genericAdapter";
import {
  inferPortfolioNote,
  inferEnglishFirst,
  inferTrack,
  humanizeSlug,
} from "./utils";
import type { JobOsCompany } from "../../types/jobOs";

/** Ordered adapter list — generic is always last as a catch-all. */
const ADAPTERS: SourceAdapter[] = [
  greenhouseAdapter,
  leverAdapter,
  ashbyAdapter,
  himalayasAdapter,
  linkedInAdapter,
  genericAdapter,
];

/** Select the best adapter for a URL and run the parse pipeline. */
export async function parseFromInput(
  input: ParseInput
): Promise<ParsedImportResult> {
  const adapter =
    ADAPTERS.find((a) => a.canHandle(input.url)) ?? genericAdapter;
  return adapter.parse(input);
}

/**
 * Convert a raw ParsedImportResult into a JobSprint-ready NormalizedImportResult.
 * Also performs deduplication against the existing company list.
 */
export function normalizeImportResult(
  parsed: ParsedImportResult,
  sourceUrl: string,
  existingCompanies: JobOsCompany[]
): NormalizedImportResult {
  const { extracted, sourcePlatform, sourceType, confidence } = parsed;

  const combinedText = [
    extracted.jobDescription ?? "",
    extracted.industryHint ?? "",
    extracted.notes ?? "",
  ]
    .join(" ")
    .trim();

  // --- Company ---
  const companyName =
    extracted.companyName?.trim() ||
    extractCompanyNameFallback(sourceUrl);

  const portfolioNote = inferPortfolioNote(combinedText);
  const noteParts = [extracted.notes, portfolioNote].filter(Boolean);

  const company: NormalizedCompanyDraft = {
    name: companyName,
    industry: extracted.industryHint ?? "",
    size: extracted.sizeHint ?? "",
    remotePolicy: extracted.remotePolicyHint ?? "",
    priority: "B",
    status: "Research",
    notes: noteParts.join(". "),
    website: extracted.website,
    careersUrl: extracted.careersUrl,
    location: extracted.locationHint,
    englishFirst:
      extracted.englishFirstHint ?? inferEnglishFirst(combinedText),
    sourceUrl,
    sourcePlatform,
    importConfidence: confidence,
    sourceType: "link",
  };

  // --- Role ---
  let role: NormalizedRoleDraft | undefined;
  if (sourceType === "job" || extracted.roleTitle) {
    const roleTitle = extracted.roleTitle?.trim() || "New Role";
    role = {
      title: roleTitle,
      url: extracted.roleUrl ?? sourceUrl,
      location: extracted.roleLocation ?? extracted.locationHint ?? "",
      seniority: extracted.seniorityHint ?? "Mid",
      track: inferTrack(roleTitle),
      fitScore: 3,
      status: "to_apply",
      jobDescription: extracted.jobDescription,
      sourcePlatform,
      importConfidence: confidence,
      sourceType: "link",
    };
  }

  // --- Deduplication ---
  const normalizedInputKey = normalizeForDedupe(companyName);
  const duplicateMatch = existingCompanies.find(
    (c) => normalizeForDedupe(c.name) === normalizedInputKey
  );

  return {
    sourcePlatform,
    sourceType,
    confidence,
    company,
    role,
    duplicateMatch: duplicateMatch
      ? { companyId: duplicateMatch.id, companyName: duplicateMatch.name }
      : undefined,
  };
}

function normalizeForDedupe(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\u00A0/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function extractCompanyNameFallback(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    const domain = hostname.replace(/^www\./, "");
    const knownBoards = ["greenhouse", "lever", "ashby", "himalayas"];
    if (knownBoards.some((b) => domain.includes(b))) {
      // Company is in the URL path for ATS boards
      const pathSlug = pathname.split("/").filter(Boolean)[0] ?? "";
      return humanizeSlug(pathSlug) || domain;
    }
    const sld = domain.split(".").slice(-2)[0] ?? domain;
    return humanizeSlug(sld);
  } catch {
    return "Unknown Company";
  }
}

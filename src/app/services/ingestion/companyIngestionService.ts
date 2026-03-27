import type {
  ParseInput,
  ParsedImportResult,
  NormalizedImportResult,
  NormalizedCompanyDraft,
  NormalizedRoleDraft,
  JobImportEnrichmentResponse,
  JobSourceData,
  SourceAdapter,
} from "./types";
import type { AiImportEnrichmentV1, JobTrack } from "../../types/jobOs";
import { greenhouseAdapter } from "./sourceAdapters/greenhouseAdapter";
import { leverAdapter } from "./sourceAdapters/leverAdapter";
import { ashbyAdapter } from "./sourceAdapters/ashbyAdapter";
import { himalayasAdapter } from "./sourceAdapters/himalayasAdapter";
import { linkedInAdapter } from "./sourceAdapters/linkedInAdapter";
import { genericAdapter } from "./sourceAdapters/genericAdapter";
import {
  cleanCompanyCandidate,
  cleanLocationCandidate,
  cleanTitleCandidate,
  extractJsonLdJobPosting,
  extractMetaDescription,
  extractMetaTags,
  extractMetaTitle,
  extractPrimaryHeading,
  inferPortfolioNote,
  inferEnglishFirst,
  inferTrack,
  inferEmploymentType,
  inferPostedDate,
  isLikelyCompanyName,
  isLikelyJobTitle,
  isLikelyLocation,
  preprocessJobDescription,
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
  const parsed = await adapter.parse(input);
  return finalizeParsedImportResult(parsed, input.url, input.pastedText);
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
  const { extracted, sourcePlatform, sourceType, confidence, aiEnrichment, jobSource } = parsed;

  const combinedText = [
    jobSource.rawJobDescription ?? extracted.jobDescription ?? "",
    extracted.industryHint ?? "",
    extracted.notes ?? "",
  ]
    .join(" ")
    .trim();

  // --- Company ---
  const companyName =
    jobSource.companyName?.trim() ||
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
    location: jobSource.rawLocation ?? extracted.locationHint,
    englishFirst:
      extracted.englishFirstHint ?? inferEnglishFirst(combinedText),
    sourceUrl,
    sourcePlatform,
    importConfidence: confidence,
    sourceType: "link",
    aiEnrichment: aiEnrichment
      ? {
          ...aiEnrichment,
          normalized: {
            ...aiEnrichment.normalized,
            company: {
              ...aiEnrichment.normalized?.company,
              name: companyName,
              industry: extracted.industryHint ?? "",
              size: extracted.sizeHint ?? "",
              remotePolicy: extracted.remotePolicyHint ?? "",
              location: extracted.locationHint,
              englishFirst:
                extracted.englishFirstHint ?? inferEnglishFirst(combinedText),
            },
          },
        }
      : undefined,
  };

  // --- Role ---
  let role: NormalizedRoleDraft | undefined;
  if (sourceType === "job" || jobSource.rawJobTitle || extracted.roleTitle) {
    const roleTitle = jobSource.rawJobTitle?.trim() || extracted.roleTitle?.trim() || "New Role";
    role = {
      title: roleTitle,
      url: extracted.roleUrl ?? sourceUrl,
      location: jobSource.rawLocation ?? extracted.roleLocation ?? extracted.locationHint ?? "",
      seniority: extracted.seniorityHint ?? "Mid",
      track: inferTrack(roleTitle),
      fitScore: 3,
      status: "to_apply",
      jobDescription: jobSource.rawJobDescription ?? extracted.jobDescription,
      sourcePlatform,
      importConfidence: confidence,
      sourceType: "link",
      aiEnrichment: aiEnrichment
        ? {
            ...aiEnrichment,
            normalized: {
              ...aiEnrichment.normalized,
              role: {
                ...aiEnrichment.normalized?.role,
                title: roleTitle,
                url: extracted.roleUrl ?? sourceUrl,
                location: extracted.roleLocation ?? extracted.locationHint ?? "",
                seniority: extracted.seniorityHint ?? "Mid",
                track: inferTrack(roleTitle),
                fitScore: 3,
                status: "to_apply",
              },
            },
          }
        : undefined,
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
    aiEnrichment,
    duplicateMatch: duplicateMatch
      ? { companyId: duplicateMatch.id, companyName: duplicateMatch.name }
      : undefined,
  };
}

function finalizeParsedImportResult(
  parsed: ParsedImportResult,
  sourceUrl: string,
  pastedText?: string
): ParsedImportResult {
  const html = parsed.raw.html ?? "";
  const meta = parsed.raw.meta ?? (html ? extractMetaTags(html) : {});
  const jsonLd = html ? extractJsonLdJobPosting(html) : null;
  const heading = html ? extractPrimaryHeading(html) : "";
  const combinedText = [
    parsed.raw.text ?? "",
    pastedText ?? "",
    parsed.extracted.jobDescription ?? "",
  ]
    .join("\n")
    .trim();

  const titleResult = selectJobTitle({
    platform: parsed.sourcePlatform,
    extractedTitle: parsed.extracted.roleTitle,
    metaTitle: extractMetaTitle(meta),
    heading,
    jsonLdTitle: asString(jsonLd?.title),
    combinedText,
  });

  const companyResult = selectCompanyName({
    platform: parsed.sourcePlatform,
    extractedCompany: parsed.extracted.companyName,
    metaCompany: meta["og:site_name"],
    jsonLdCompany: asHiringOrganizationName(jsonLd),
    sourceUrl,
  });

  const locationResult = selectLocation({
    extractedLocation: parsed.extracted.roleLocation ?? parsed.extracted.locationHint,
    jsonLdLocation: asJobLocation(jsonLd),
    metaLocation: meta["job:location"] || meta["twitter:label1"],
    combinedText,
  });

  const descriptionResult = selectDescription({
    extractedDescription: parsed.extracted.jobDescription,
    metaDescription: extractMetaDescription(meta),
    pastedText,
    rawText: parsed.raw.text,
  });

  const employmentType =
    parsed.extracted.employmentTypeHint?.trim() ||
    asEmploymentType(jsonLd) ||
    inferEmploymentType(combinedText) ||
    undefined;
  const postedDate =
    parsed.extracted.postedDateHint?.trim() ||
    asDatePosted(jsonLd) ||
    inferPostedDate(combinedText) ||
    undefined;

  const jobSource: JobSourceData = {
    sourceUrl,
    sourcePlatform: parsed.sourcePlatform,
    sourceType: parsed.sourceType,
    companyName: companyResult.value,
    rawJobTitle: titleResult.value,
    rawLocation: locationResult.value,
    rawJobDescription: descriptionResult.value,
    employmentType,
    postedDate,
    debug: {
      titleSource: titleResult.source,
      companySource: companyResult.source,
      locationSource: locationResult.source,
      descriptionSource: descriptionResult.source,
    },
  };

  const confidence = scoreParsedJobSource(jobSource);

  return {
    ...parsed,
    confidence,
    raw: {
      ...parsed.raw,
      meta: Object.keys(meta).length > 0 ? meta : parsed.raw.meta,
    },
    extracted: {
      ...parsed.extracted,
      companyName: jobSource.companyName,
      roleTitle: jobSource.rawJobTitle,
      roleLocation: jobSource.rawLocation,
      locationHint: jobSource.rawLocation ?? parsed.extracted.locationHint,
      jobDescription: jobSource.rawJobDescription,
      employmentTypeHint: employmentType,
      postedDateHint: postedDate,
    },
    jobSource,
  };
}

function selectJobTitle(input: {
  platform: ParsedImportResult["sourcePlatform"];
  extractedTitle?: string;
  metaTitle?: string;
  heading?: string;
  jsonLdTitle?: string;
  combinedText: string;
}): { value?: string; source?: JobSourceData["debug"]["titleSource"] } {
  const candidates: Array<{ value?: string; source: NonNullable<JobSourceData["debug"]>["titleSource"] }> = [
    { value: input.jsonLdTitle, source: "jsonld" },
    { value: input.metaTitle, source: "meta" },
    { value: input.heading, source: "h1" },
    { value: input.extractedTitle, source: "selector" },
    { value: fallbackTitleFromText(input.combinedText, input.platform), source: "fallback" },
  ];

  for (const candidate of candidates) {
    const cleaned = cleanTitleCandidate(candidate.value ?? "");
    if (isLikelyJobTitle(cleaned)) {
      return { value: cleaned, source: candidate.source };
    }
  }

  return {};
}

function selectCompanyName(input: {
  platform: ParsedImportResult["sourcePlatform"];
  extractedCompany?: string;
  metaCompany?: string;
  jsonLdCompany?: string;
  sourceUrl: string;
}): { value?: string; source?: JobSourceData["debug"]["companySource"] } {
  const domainFallback = extractCompanyNameFallback(input.sourceUrl);
  const candidates: Array<{ value?: string; source: NonNullable<JobSourceData["debug"]>["companySource"] }> = [
    { value: input.jsonLdCompany, source: "jsonld" },
    { value: input.extractedCompany, source: "selector" },
    { value: input.metaCompany, source: "meta" },
    { value: domainFallback, source: "domain" },
  ];

  for (const candidate of candidates) {
    const cleaned = cleanCompanyCandidate(candidate.value ?? "");
    if (isLikelyCompanyName(cleaned)) {
      return { value: cleaned, source: candidate.source };
    }
  }

  return {};
}

function selectLocation(input: {
  extractedLocation?: string;
  jsonLdLocation?: string;
  metaLocation?: string;
  combinedText: string;
}): { value?: string; source?: JobSourceData["debug"]["locationSource"] } {
  const fallback = fallbackLocationFromText(input.combinedText);
  const candidates: Array<{ value?: string; source: NonNullable<JobSourceData["debug"]>["locationSource"] }> = [
    { value: input.jsonLdLocation, source: "jsonld" },
    { value: input.extractedLocation, source: "selector" },
    { value: input.metaLocation, source: "meta" },
    { value: fallback, source: "text" },
  ];

  for (const candidate of candidates) {
    const cleaned = cleanLocationCandidate(candidate.value ?? "");
    if (isLikelyLocation(cleaned)) {
      return { value: cleaned, source: candidate.source };
    }
  }

  return {};
}

function selectDescription(input: {
  extractedDescription?: string;
  metaDescription?: string;
  pastedText?: string;
  rawText?: string;
}): { value?: string; source?: JobSourceData["debug"]["descriptionSource"] } {
  const candidates: Array<{ value?: string; source: NonNullable<JobSourceData["debug"]>["descriptionSource"] }> = [
    { value: input.extractedDescription, source: "selector" },
    { value: input.pastedText, source: "pasted_text" },
    { value: input.rawText, source: "text" },
    { value: input.metaDescription, source: "meta" },
  ];

  for (const candidate of candidates) {
    const cleaned = preprocessJobDescription(candidate.value);
    if (cleaned && cleaned.length >= 120) {
      return { value: cleaned, source: candidate.source };
    }
  }

  return {};
}

function fallbackTitleFromText(text: string, platform: ParsedImportResult["sourcePlatform"]): string {
  const lines = text
    .split("\n")
    .map((line) => cleanTitleCandidate(line))
    .filter(Boolean);

  for (const line of lines.slice(0, platform === "linkedin" ? 12 : 8)) {
    if (isLikelyJobTitle(line)) {
      return line;
    }
  }

  return "";
}

function fallbackLocationFromText(text: string): string {
  const lines = text
    .split("\n")
    .map((line) => cleanLocationCandidate(line))
    .filter(Boolean);

  for (const line of lines.slice(0, 12)) {
    if (isLikelyLocation(line)) {
      return line;
    }
  }

  return "";
}

function scoreParsedJobSource(jobSource: JobSourceData): number {
  let score = 0.2;

  if (jobSource.rawJobTitle) {
    score += boostForSource(jobSource.debug?.titleSource, 0.24, 0.18, 0.14, 0.08);
  } else {
    score -= 0.08;
  }

  if (jobSource.companyName) {
    score += boostForSource(jobSource.debug?.companySource, 0.22, 0.16, 0.12, 0.06);
  } else {
    score -= 0.08;
  }

  if (jobSource.rawLocation) {
    score += boostForSource(jobSource.debug?.locationSource, 0.14, 0.1, 0.08, 0.05);
  }

  if (jobSource.rawJobDescription && jobSource.rawJobDescription.length >= 400) {
    score += boostForSource(jobSource.debug?.descriptionSource, 0.18, 0.14, 0.12, 0.08);
  } else if (jobSource.rawJobDescription) {
    score += 0.06;
  } else {
    score -= 0.06;
  }

  if (jobSource.employmentType) score += 0.04;
  if (jobSource.postedDate) score += 0.04;

  return Math.max(0.1, Math.min(0.95, Number(score.toFixed(2))));
}

function boostForSource(
  source: string | undefined,
  structured: number,
  selector: number,
  meta: number,
  fallback: number
): number {
  if (source === "jsonld") return structured;
  if (source === "h1" || source === "selector") return selector;
  if (source === "meta" || source === "text" || source === "pasted_text") return meta;
  return fallback;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asHiringOrganizationName(jsonLd: Record<string, unknown> | null): string | undefined {
  if (!jsonLd) return undefined;
  const org = jsonLd.hiringOrganization;
  if (org && typeof org === "object" && !Array.isArray(org)) {
    return asString((org as Record<string, unknown>).name);
  }
  return undefined;
}

function asJobLocation(jsonLd: Record<string, unknown> | null): string | undefined {
  if (!jsonLd) return undefined;
  const jobLocation = jsonLd.jobLocation;
  const locations = Array.isArray(jobLocation) ? jobLocation : [jobLocation];
  for (const location of locations) {
    if (!location || typeof location !== "object") continue;
    const address = (location as Record<string, unknown>).address;
    if (!address || typeof address !== "object" || Array.isArray(address)) continue;
    const record = address as Record<string, unknown>;
    const locality = asString(record.addressLocality);
    const region = asString(record.addressRegion);
    const country = asString(record.addressCountry);
    const pieces = [locality, region || country].filter(Boolean);
    if (pieces.length > 0) {
      return pieces.join(", ");
    }
  }
  return undefined;
}

function asEmploymentType(jsonLd: Record<string, unknown> | null): string | undefined {
  if (!jsonLd) return undefined;
  const employmentType = jsonLd.employmentType;
  if (Array.isArray(employmentType)) {
    return asString(employmentType[0]);
  }
  return asString(employmentType);
}

function asDatePosted(jsonLd: Record<string, unknown> | null): string | undefined {
  if (!jsonLd) return undefined;
  const datePosted = asString(jsonLd.datePosted);
  if (!datePosted) return undefined;
  const isoDate = datePosted.match(/^\d{4}-\d{2}-\d{2}/);
  return isoDate ? isoDate[0] : datePosted;
}

export function mergeImportEnrichment(
  normalized: NormalizedImportResult,
  enrichment: JobImportEnrichmentResponse
): NormalizedImportResult {
  const aiEnrichment = buildAiEnrichment(normalized, enrichment);
  const nextCompany = { ...normalized.company };
  const nextRole = normalized.role ? { ...normalized.role } : undefined;

  if (!nextCompany.industry.trim() && enrichment.industry !== "Unknown") {
    nextCompany.industry = enrichment.industry;
  }

  if (!nextCompany.size.trim() && enrichment.companySizeBand !== "Unknown") {
    nextCompany.size = enrichment.companySizeBand;
  }

  if (!nextCompany.remotePolicy.trim() && enrichment.workplaceMode !== "Unknown") {
    nextCompany.remotePolicy = enrichment.workplaceMode;
  }

  if (nextCompany.priority === "B" && enrichment.priorityBand !== "Unknown") {
    nextCompany.priority = enrichment.priorityBand;
  }

  nextCompany.aiEnrichment = {
    ...aiEnrichment,
    normalized: {
      ...aiEnrichment.normalized,
      company: {
        ...aiEnrichment.normalized?.company,
        name: nextCompany.name,
        industry: nextCompany.industry,
        size: nextCompany.size,
        remotePolicy: nextCompany.remotePolicy,
        location: nextCompany.location,
        englishFirst: nextCompany.englishFirst as "Yes" | "Mostly" | "Unknown" | undefined,
      },
    },
  };

  if (nextRole) {
    if (
      (nextRole.title.trim() === "" || nextRole.title === "New Role") &&
      enrichment.canonicalTitle !== "Unknown"
    ) {
      nextRole.title = enrichment.canonicalTitle;
    }

    if (
      (!nextRole.seniority.trim() || nextRole.seniority === "Mid") &&
      enrichment.seniority !== "Unknown"
    ) {
      nextRole.seniority = mapAiSeniorityToRoleValue(enrichment.seniority);
    }

    if (enrichment.roleTrack !== "Unknown") {
      nextRole.track = enrichment.roleTrack as JobTrack;
    }

    nextRole.fitScore = enrichment.fitScore;

    if (!nextRole.nextAction?.trim() && enrichment.nextBestAction !== "Archive") {
      nextRole.nextAction = enrichment.nextBestAction;
    }

    nextRole.aiEnrichment = {
      ...aiEnrichment,
      normalized: {
        ...aiEnrichment.normalized,
        role: {
          ...aiEnrichment.normalized?.role,
          title: nextRole.title,
          url: nextRole.url,
          location: nextRole.location,
          seniority: nextRole.seniority,
          track: nextRole.track,
          fitScore: nextRole.fitScore,
          status: nextRole.status,
          nextAction: nextRole.nextAction,
        },
      },
    };
  }

  return {
    ...normalized,
    company: nextCompany,
    role: nextRole,
    aiEnrichment,
  };
}

function buildAiEnrichment(
  normalized: NormalizedImportResult,
  enrichment: JobImportEnrichmentResponse
): AiImportEnrichmentV1 {
  return {
    schemaVersion: enrichment.schemaVersion,
    rawExtracted: normalized.aiEnrichment?.rawExtracted ??
      normalized.company.aiEnrichment?.rawExtracted ??
      normalized.role?.aiEnrichment?.rawExtracted,
    normalized: {
      company: {
        ...normalized.company.aiEnrichment?.normalized?.company,
      },
      role: normalized.role
        ? {
            ...normalized.role.aiEnrichment?.normalized?.role,
          }
        : undefined,
    },
    enriched: {
      company: {
        industry: enrichment.industry,
        sizeBand: enrichment.companySizeBand,
        companyStage: enrichment.companyStage,
      },
      role: normalized.role
        ? {
            track: enrichment.roleTrack,
            seniority: enrichment.seniority,
            nextBestAction: enrichment.nextBestAction,
            applicationReadiness:
              enrichment.nextBestAction === "Apply"
                ? "ready_to_apply"
                : enrichment.nextBestAction === "Tailor CV"
                  ? "needs_tailoring"
                  : "needs_research",
          }
        : undefined,
    },
    confidence: enrichment.confidence,
    reviewFlags: enrichment.reviewFlags,
    model: enrichment.model,
    generatedAt: new Date().toISOString(),
  };
}

function mapAiSeniorityToRoleValue(value: JobImportEnrichmentResponse["seniority"]): string {
  if (value === "Middle") return "Mid";
  return value;
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

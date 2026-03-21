import type { Application, NextActionTask, OpportunityScore, UserProfileSignals } from "../types";
import { parseFromInput } from "./ingestion/companyIngestionService";
import type { IngestionSourcePlatform } from "./ingestion/types";
import {
  scoreApplicationOpportunity,
  generateTasksForApplication,
} from "./nextBestActionEngine";

export interface ImportResult {
  applicationDraft: Omit<Application, "id">;
  score: OpportunityScore;
  tasks: Omit<NextActionTask, "id" | "createdAt" | "updatedAt">[];
  sourceLabel: string;
  extractedDescription?: string;
  confidence: number;
}

const SOURCE_LABELS: Record<IngestionSourcePlatform, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
  himalayas: "Himalayas",
  linkedin: "LinkedIn",
  generic: "Generic",
  unknown: "Unknown",
};

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export async function importJobFromUrl(
  url: string,
  pastedText?: string,
  userProfileSignals?: UserProfileSignals
): Promise<ImportResult> {
  const parsed = await parseFromInput({ url, pastedText });
  const { extracted, sourcePlatform, confidence } = parsed;

  const today = new Date().toISOString().split("T")[0];

  const applicationDraft: Omit<Application, "id"> = {
    company: extracted.companyName?.trim() || hostnameOf(url),
    role: extracted.roleTitle?.trim() || "",
    location: extracted.roleLocation?.trim() || extracted.locationHint?.trim() || "Remote",
    type: "product",
    salary: "",
    jobLink: url,
    dateApplied: today,
    referral: false,
    notes: extracted.jobDescription
      ? extracted.jobDescription.slice(0, 500)
      : "",
    status: "targeted",
    priority: "medium",
  };

  // Score using a surrogate id so we can generate tasks pre-save
  const surrogateApp: Application = { ...applicationDraft, id: `import-preview-${Date.now()}` };
  const score = scoreApplicationOpportunity(surrogateApp, userProfileSignals);

  const tasks = generateTasksForApplication(surrogateApp, score, []);

  return {
    applicationDraft,
    score,
    tasks,
    sourceLabel: SOURCE_LABELS[sourcePlatform] ?? "Generic",
    extractedDescription: extracted.jobDescription ?? undefined,
    confidence,
  };
}

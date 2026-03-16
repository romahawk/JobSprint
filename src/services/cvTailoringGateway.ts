import type { CvProfile } from "../app/types/jobOs";
import type {
  ChangedWordSpan,
  FitAnalysisResult,
  QuickTailorResult,
} from "./cvOptimizerService";

export interface CvTailoringRequest {
  mode: "quickTailor" | "fullTailor";
  cvName: string;
  cvVersion?: string;
  cvSourceText?: string;
  profile: CvProfile;
  analysis: FitAnalysisResult;
  jobDescriptionText: string;
  company?: string;
  roleTitle?: string;
}

export interface CvTailoringResponse extends QuickTailorResult {
  fullCvText?: string;
  changedLineIndices?: number[];
  changedWordSpans?: ChangedWordSpan[];
  provider?: "remote";
  model?: string;
}

function remoteBaseUrl(): string {
  return (import.meta.env.VITE_JSPRINT_REMOTE_API_URL || "").trim();
}

export function isRemoteCvTailoringEnabled(): boolean {
  return Boolean(remoteBaseUrl());
}

export async function requestRemoteCvTailoring(
  payload: CvTailoringRequest
): Promise<CvTailoringResponse | null> {
  const baseUrl = remoteBaseUrl();
  if (!baseUrl) {
    return null;
  }

  const response = await fetch(`${baseUrl}/cv-tailor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Remote CV tailoring failed: ${response.status}`);
  }

  const data = (await response.json()) as Partial<CvTailoringResponse>;
  if (!data || typeof data !== "object") {
    throw new Error("Remote CV tailoring returned an invalid payload.");
  }

  return {
    headline: typeof data.headline === "string" ? data.headline : "",
    summary: typeof data.summary === "string" ? data.summary : "",
    rewrittenBullets: Array.isArray(data.rewrittenBullets)
      ? data.rewrittenBullets.filter((value): value is string => typeof value === "string")
      : [],
    portfolioRecommendations: Array.isArray(data.portfolioRecommendations)
      ? data.portfolioRecommendations.filter((value): value is string => typeof value === "string")
      : [],
    fullCvText: typeof data.fullCvText === "string" ? data.fullCvText : undefined,
    changedLineIndices: Array.isArray(data.changedLineIndices)
      ? data.changedLineIndices.filter((value): value is number => typeof value === "number")
      : undefined,
    changedWordSpans: Array.isArray(data.changedWordSpans)
      ? data.changedWordSpans.filter(
          (value): value is ChangedWordSpan =>
            Boolean(value) &&
            typeof value === "object" &&
            typeof value.lineIndex === "number" &&
            typeof value.startWord === "number" &&
            typeof value.endWord === "number"
        )
      : undefined,
    provider: "remote",
    model: typeof data.model === "string" ? data.model : undefined,
  };
}

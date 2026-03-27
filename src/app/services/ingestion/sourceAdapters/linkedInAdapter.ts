import type { SourceAdapter, ParseInput, ParsedImportResult } from "../types";
import {
  cleanCompanyCandidate,
  cleanLocationCandidate,
  cleanTitleCandidate,
  inferIndustry,
  inferRemotePolicy,
  inferSeniority,
  isLikelyCompanyName,
  isLikelyJobTitle,
  isLikelyLocation,
} from "../utils";

const LINKEDIN_RE = /https?:\/\/(?:www\.)?linkedin\.com\//i;

export const linkedInAdapter: SourceAdapter = {
  canHandle(url: string): boolean {
    return LINKEDIN_RE.test(url);
  },

  async parse(input: ParseInput): Promise<ParsedImportResult> {
    const extracted: ParsedImportResult["extracted"] = {
      roleUrl: input.url,
    };

    // LinkedIn blocks all browser fetches via CORS + auth walls.
    // We rely entirely on pasted text for meaningful extraction.
    let confidence = 0.2;

    if (input.pastedText) {
      const text = input.pastedText;
      confidence = 0.55;

      // Common patterns in LinkedIn job page copy:
      // "Senior PM at Acme Corp\n..." or "Acme Corp\nSenior PM\n..."
      const atPattern = text.match(/^(.+?)\s+at\s+(.+?)(?:\n|$)/im);
      if (atPattern) {
        extracted.roleTitle = atPattern[1].trim();
        extracted.companyName = atPattern[2].trim();
      }

      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      if (!extracted.roleTitle) {
        const titleLine = lines.find((line) => isLikelyJobTitle(cleanTitleCandidate(line)));
        if (titleLine) {
          extracted.roleTitle = cleanTitleCandidate(titleLine);
        }
      }
      if (!extracted.companyName) {
        const companyLine = lines.find((line) => isLikelyCompanyName(cleanCompanyCandidate(line)));
        if (companyLine && companyLine !== extracted.roleTitle) {
          extracted.companyName = cleanCompanyCandidate(companyLine);
        }
      }
      const locationLine = lines.find((line) => isLikelyLocation(cleanLocationCandidate(line)));
      if (locationLine) {
        extracted.roleLocation = cleanLocationCandidate(locationLine);
      }

      extracted.jobDescription = text.slice(0, 3000);
      extracted.industryHint = inferIndustry(text) || undefined;
      extracted.remotePolicyHint = inferRemotePolicy(text) || undefined;
      if (extracted.roleTitle) {
        extracted.seniorityHint = inferSeniority(extracted.roleTitle);
      }
    }

    return {
      sourcePlatform: "linkedin",
      sourceType: "job",
      confidence,
      jobSource: {
        sourceUrl: input.url,
        sourcePlatform: "linkedin",
        sourceType: "job",
        companyName: extracted.companyName,
        rawJobTitle: extracted.roleTitle,
        rawLocation: extracted.roleLocation,
        rawJobDescription: extracted.jobDescription,
      },
      raw: { text: input.pastedText },
      extracted,
    };
  },
};

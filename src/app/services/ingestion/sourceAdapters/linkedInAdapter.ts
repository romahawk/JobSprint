import type { SourceAdapter, ParseInput, ParsedImportResult } from "../types";
import { inferIndustry, inferRemotePolicy, inferSeniority } from "../utils";

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

      if (!extracted.roleTitle && lines[0]) {
        extracted.roleTitle = lines[0];
      }
      if (!extracted.companyName && lines[1] && lines[1].length < 80) {
        extracted.companyName = lines[1];
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
      raw: { text: input.pastedText },
      extracted,
    };
  },
};

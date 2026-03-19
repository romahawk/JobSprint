import type { SourceAdapter, ParseInput, ParsedImportResult } from "../types";
import {
  humanizeSlug,
  extractMetaTags,
  extractTitle,
  stripHtml,
  inferIndustry,
  inferRemotePolicy,
  inferSeniority,
  extractLocationHint,
  fetchWithTimeout,
} from "../utils";

// Matches both legacy and new Greenhouse board domains
const GREENHOUSE_RE =
  /https?:\/\/(?:boards|job-boards)\.greenhouse\.io\/([^/?#]+)(?:\/jobs\/(\d+))?/i;

export const greenhouseAdapter: SourceAdapter = {
  canHandle(url: string): boolean {
    return GREENHOUSE_RE.test(url);
  },

  async parse(input: ParseInput): Promise<ParsedImportResult> {
    const match = input.url.match(GREENHOUSE_RE);
    const companySlug = match?.[1] ?? "";
    const jobId = match?.[2] ?? "";
    const companyName = humanizeSlug(companySlug);
    const careersUrl = companySlug
      ? `https://boards.greenhouse.io/${companySlug}`
      : undefined;

    const extracted: ParsedImportResult["extracted"] = {
      companyName,
      careersUrl,
      roleUrl: input.url,
    };

    let html = "";
    let confidence = 0.5; // Base: URL pattern matched

    const fetcher = input.fetchHtml ?? fetchWithTimeout;
    try {
      html = await fetcher(input.url);
    } catch {
      // CORS or network error — fall back to pasted text
    }

    const rawText = html ? stripHtml(html) : "";
    const combinedText = [rawText, input.pastedText ?? ""].join(" ").trim();

    if (html) {
      const meta = extractMetaTags(html);
      const title = extractTitle(html);

      // "Senior PM at Acme Health" or "Senior PM - Acme Health"
      const atSplit = title.split(/\s+at\s+|\s+[-–|]\s+/);
      if (atSplit.length >= 2) {
        extracted.roleTitle = atSplit[0].trim();
      } else if (title && !/jobs?/i.test(title)) {
        extracted.roleTitle = title.trim();
      }

      if (meta["og:title"]) {
        const ogParts = meta["og:title"].split(/\s+at\s+|\s+[-–|]\s+/);
        if (ogParts.length >= 2) {
          extracted.roleTitle = ogParts[0].trim();
        }
      }

      const desc = meta["og:description"] ?? meta["description"] ?? "";
      if (desc) extracted.jobDescription = desc.slice(0, 3000);

      confidence = 0.8;
    }

    if (!extracted.jobDescription && input.pastedText) {
      extracted.jobDescription = input.pastedText.slice(0, 3000);
      confidence = Math.max(confidence, 0.65);
    }

    if (combinedText) {
      extracted.industryHint = inferIndustry(combinedText) || undefined;
      extracted.remotePolicyHint = inferRemotePolicy(combinedText) || undefined;
      extracted.locationHint = extractLocationHint(combinedText) || undefined;
      if (extracted.roleTitle) {
        extracted.seniorityHint = inferSeniority(extracted.roleTitle);
      }
    }

    return {
      sourcePlatform: "greenhouse",
      sourceType: jobId ? "job" : "company",
      confidence,
      raw: { html: html || undefined, text: rawText || undefined },
      extracted,
    };
  },
};

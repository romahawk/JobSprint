import type { SourceAdapter, ParseInput, ParsedImportResult } from "../types";
import {
  extractDomain,
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

export const genericAdapter: SourceAdapter = {
  canHandle(_url: string): boolean {
    return true; // catch-all — always last in adapter list
  },

  async parse(input: ParseInput): Promise<ParsedImportResult> {
    const domain = extractDomain(input.url);
    const domainParts = domain.split(".");
    // Use the second-level domain as the company name hint
    const sldIndex = domainParts.length >= 2 ? domainParts.length - 2 : 0;
    const companySlug = domainParts[sldIndex] ?? "";
    const companyName = humanizeSlug(companySlug);

    const isJobPath =
      /\/(jobs?|careers?|openings?|positions?|join|vacancies?)\//i.test(input.url);

    const extracted: ParsedImportResult["extracted"] = {
      companyName,
      website: domain ? `https://${domain}` : undefined,
      roleUrl: isJobPath ? input.url : undefined,
    };

    let html = "";
    let confidence = 0.3;

    const fetcher = input.fetchHtml ?? fetchWithTimeout;
    try {
      html = await fetcher(input.url);
    } catch {
      // CORS or network error
    }

    const rawText = html ? stripHtml(html) : "";
    const combinedText = [rawText, input.pastedText ?? ""].join(" ").trim();

    if (html) {
      const meta = extractMetaTags(html);
      const title = extractTitle(html);

      // OG site name is the most reliable company name signal
      if (meta["og:site_name"]) {
        extracted.companyName = meta["og:site_name"];
      }

      if (meta["og:title"]) {
        const ogParts = meta["og:title"].split(/\s+at\s+|\s+[-–|]\s+/);
        if (ogParts.length >= 2) {
          extracted.roleTitle = ogParts[0].trim();
          if (!meta["og:site_name"]) {
            extracted.companyName = ogParts[1].trim();
          }
        } else {
          extracted.roleTitle = meta["og:title"].trim();
        }
      } else if (title) {
        const titleParts = title.split(/\s+at\s+|\s+[-–|]\s+/);
        if (titleParts.length >= 2) {
          extracted.roleTitle = titleParts[0].trim();
          if (!meta["og:site_name"]) {
            extracted.companyName = titleParts[1].trim();
          }
        }
      }

      const desc = meta["og:description"] ?? meta["description"] ?? "";
      if (desc) extracted.jobDescription = desc.slice(0, 3000);

      if (isJobPath && domain) {
        const rootDomain = domainParts.slice(-2).join(".");
        extracted.careersUrl = `https://${rootDomain}/careers`;
      }

      confidence = 0.55;
    }

    if (!extracted.jobDescription && input.pastedText) {
      extracted.jobDescription = input.pastedText.slice(0, 3000);
      confidence = Math.max(confidence, 0.45);
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
      sourcePlatform: "generic",
      sourceType: isJobPath ? "job" : "unknown",
      confidence,
      raw: { html: html || undefined, text: rawText || undefined },
      extracted,
    };
  },
};

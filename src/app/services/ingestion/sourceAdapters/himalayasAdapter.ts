import type { SourceAdapter, ParseInput, ParsedImportResult } from "../types";
import {
  humanizeSlug,
  extractMetaTags,
  extractTitle,
  stripHtml,
  inferIndustry,
  inferSeniority,
  fetchWithTimeout,
} from "../utils";

// https://himalayas.app/jobs/companies/{company}/{slug}
// https://himalayas.app/companies/{company}
const HIMALAYAS_RE = /https?:\/\/himalayas\.app\//i;

export const himalayasAdapter: SourceAdapter = {
  canHandle(url: string): boolean {
    return HIMALAYAS_RE.test(url);
  },

  async parse(input: ParseInput): Promise<ParsedImportResult> {
    const urlObj = (() => {
      try {
        return new URL(input.url);
      } catch {
        return null;
      }
    })();

    const pathParts = urlObj?.pathname.split("/").filter(Boolean) ?? [];
    let companySlug = "";
    const isJobUrl = pathParts[0] === "jobs";

    if (pathParts[0] === "jobs" && pathParts[1] === "companies") {
      companySlug = pathParts[2] ?? "";
    } else if (pathParts[0] === "companies") {
      companySlug = pathParts[1] ?? "";
    }

    const companyName = humanizeSlug(companySlug);

    const extracted: ParsedImportResult["extracted"] = {
      companyName: companyName || undefined,
      roleUrl: isJobUrl ? input.url : undefined,
      remotePolicyHint: "Remote", // Himalayas is a remote-first job board
    };

    let html = "";
    let confidence = 0.45;

    const fetcher = input.fetchHtml ?? fetchWithTimeout;
    try {
      html = await fetcher(input.url);
    } catch {
      // Fetch failed
    }

    const rawText = html ? stripHtml(html) : "";
    const combinedText = [rawText, input.pastedText ?? ""].join(" ").trim();

    if (html) {
      const meta = extractMetaTags(html);
      const title = extractTitle(html);

      if (meta["og:title"]) {
        const ogTitle = meta["og:title"];
        const titleParts = ogTitle.split(/\s+at\s+|\s+[-–|]\s+/);
        if (titleParts.length >= 2) {
          extracted.roleTitle = titleParts[0].trim();
          if (!extracted.companyName) {
            extracted.companyName = titleParts[1].trim();
          }
        }
      } else if (title) {
        extracted.roleTitle = title.split(/\s+[-–|]\s+/)[0]?.trim();
      }

      const desc = meta["og:description"] ?? meta["description"] ?? "";
      if (desc) extracted.jobDescription = desc.slice(0, 3000);

      confidence = 0.75;
    }

    if (!extracted.jobDescription && input.pastedText) {
      extracted.jobDescription = input.pastedText.slice(0, 3000);
      confidence = Math.max(confidence, 0.6);
    }

    if (combinedText) {
      extracted.industryHint = inferIndustry(combinedText) || undefined;
      if (extracted.roleTitle) {
        extracted.seniorityHint = inferSeniority(extracted.roleTitle);
      }
    }

    return {
      sourcePlatform: "himalayas",
      sourceType: isJobUrl ? "job" : "company",
      confidence,
      jobSource: {
        sourceUrl: input.url,
        sourcePlatform: "himalayas",
        sourceType: isJobUrl ? "job" : "company",
        companyName: extracted.companyName,
        rawJobTitle: extracted.roleTitle,
        rawLocation: extracted.locationHint,
        rawJobDescription: extracted.jobDescription,
      },
      raw: { html: html || undefined, text: rawText || undefined },
      extracted,
    };
  },
};

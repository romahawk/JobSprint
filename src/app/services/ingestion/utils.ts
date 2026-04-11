/** Extract the hostname from a URL safely, stripping leading www. */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Convert a URL slug like "acme-health-corp" → "Acme Health Corp" */
export function humanizeSlug(slug: string): string {
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Strip HTML tags, scripts, styles and collapse whitespace */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract meta tag values from HTML as a name/property → content map */
export function extractMetaTags(html: string): Record<string, string> {
  const meta: Record<string, string> = {};

  // name/property before content
  const re1 =
    /<meta\s+(?:[^>]*?\s)?(?:name|property)=["']([^"']+)["'][^>]*?\s+content=["']([^"']+)["'][^>]*?\/?>/gi;
  let match: RegExpExecArray | null;
  while ((match = re1.exec(html)) !== null) {
    meta[match[1].toLowerCase()] = match[2];
  }

  // content before name/property (reversed attribute order)
  const re2 =
    /<meta\s+(?:[^>]*?\s)?content=["']([^"']+)["'][^>]*?\s+(?:name|property)=["']([^"']+)["'][^>]*?\/?>/gi;
  while ((match = re2.exec(html)) !== null) {
    meta[match[2].toLowerCase()] = match[1];
  }

  return meta;
}

/** Extract page <title> text from HTML */
export function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : "";
}

/**
 * Attempt a browser-side fetch with a timeout.
 * Callers should catch any network / CORS errors and fall back gracefully.
 */
export async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Infer industry category from free text keywords */
export function inferIndustry(text: string): string {
  const lower = text.toLowerCase();
  if (/health|clinical|medical|hospital|telemedicine|biotech|pharma/.test(lower))
    return "Healthcare";
  if (/fintech|trading|payments|crypto|banking|insurance|finance|risk/.test(lower))
    return "Fintech / Finance";
  if (/logistics|supply chain|warehouse|freight|shipping|fleet/.test(lower))
    return "Logistics";
  if (/marketplace|e-commerce|ecommerce|retail/.test(lower))
    return "E-Commerce / Marketplace";
  if (/hr|talent|recruiting|staffing|workforce/.test(lower)) return "HR / Talent";
  if (/security|cybersecurity|infosec/.test(lower)) return "Cybersecurity";
  if (/edtech|education|learning|school/.test(lower)) return "EdTech";
  if (/ai|machine learning|deep learning|data/.test(lower)) return "AI / Data";
  if (/media|content|streaming|video|audio/.test(lower)) return "Media / Content";
  if (/real estate|proptech|property/.test(lower)) return "PropTech";
  if (/saas|software|platform|api|developer|engineering|cloud/.test(lower))
    return "SaaS / Software";
  return "";
}

/** Infer remote work policy from free text */
export function inferRemotePolicy(text: string): string {
  const lower = text.toLowerCase();
  if (/fully remote|100% remote|remote-first|remote first|all remote/.test(lower))
    return "Remote";
  if (/hybrid|flexible|part.?remote/.test(lower)) return "Hybrid";
  if (/on.?site|in.?office|in person|on premise|onsite/.test(lower)) return "On-site";
  return "";
}

/** Infer seniority level from a role title */
export function inferSeniority(title: string): string {
  const lower = title.toLowerCase();
  if (/\bvp\b|vice president/.test(lower)) return "VP";
  if (/\bhead of\b|director/.test(lower)) return "Director";
  if (/senior|sr\.|staff|principal|lead/.test(lower)) return "Senior";
  if (/junior|jr\.|associate|entry/.test(lower)) return "Junior";
  return "Mid";
}

/** Infer target job track from a role title */
export function inferTrack(title: string): "TPM" | "Product Engineer" | "Systems PM" {
  const lower = title.toLowerCase();
  if (
    /technical product|tpm|delivery manager|program manager|implementation/.test(lower)
  )
    return "TPM";
  if (
    /engineer|developer|fullstack|frontend|backend|platform|solutions engineer/.test(
      lower
    )
  )
    return "Product Engineer";
  return "Systems PM";
}

/**
 * Append portfolio fit hints to notes based on text keywords.
 * Used for enrichment after parsing.
 */
export function inferPortfolioNote(text: string): string {
  const lower = text.toLowerCase();
  const notes: string[] = [];
  if (/health|clinical|medical|hospital|telemedicine/.test(lower)) {
    notes.push("Portfolio fit: LiveSurgery angle");
  }
  if (/fintech|trading|payments|crypto|banking|risk/.test(lower)) {
    notes.push("Portfolio fit: AlphaRhythm angle");
  }
  if (/operations|logistics|workflow|supply chain/.test(lower)) {
    notes.push("Portfolio fit: FlowLogix / Supply Tracker angle");
  }
  return notes.join(". ");
}

/** Infer English-first working language likelihood */
export function inferEnglishFirst(text: string): "Yes" | "Mostly" | "Unknown" {
  const lower = text.toLowerCase();
  if (
    /german|french|spanish|dutch|hebrew|arabic|hindi|portuguese|japanese|korean|mandarin/.test(
      lower
    )
  ) {
    return "Mostly";
  }
  if (
    /fluent in english|english required|english proficiency|native english|business english/.test(
      lower
    )
  ) {
    return "Yes";
  }
  return "Unknown";
}

/** Extract a rough location hint from body text */
export function extractLocationHint(text: string): string {
  const remote = text.match(/\b(remote|worldwide|global)\b/i);
  if (remote) return remote[0];
  // "City, ST" or "City, Country"
  const city = text.match(/\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2,})\b/);
  if (city) return city[0].trim();
  return "";
}

export function extractJsonLdJobPosting(html: string): Record<string, unknown> | null {
  const matches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

  for (const match of matches) {
    const raw = match[1]?.trim();
    if (!raw) continue;

    const parsed = safeJsonParse(raw);
    const jobPosting = findJobPosting(parsed);
    if (jobPosting) {
      return jobPosting;
    }
  }

  return null;
}

export function extractPrimaryHeading(html: string): string {
  const headingMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return headingMatch ? stripHtml(headingMatch[1]) : "";
}

export function extractMetaTitle(meta: Record<string, string>): string {
  return meta["og:title"] || meta["twitter:title"] || "";
}

export function extractMetaDescription(meta: Record<string, string>): string {
  return meta["og:description"] || meta["twitter:description"] || meta["description"] || "";
}

export function cleanTitleCandidate(value: string): string {
  return value
    .replace(/\s+at\s+[^|–—-]+$/i, "")
    .replace(/\s+[-|–—]\s+[^|–—-]+$/i, "")
    .replace(/\s*\|.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isLikelyJobTitle(value: string): boolean {
  const candidate = cleanTitleCandidate(value);
  if (!candidate || candidate.length < 2 || candidate.length > 120) return false;
  if (/[.!?].{15,}$/.test(candidate)) return false;
  if (candidate.split(/\s+/).length > 12) return false;
  if (/^(join|about|what|who|we|our|the)\b/i.test(candidate)) return false;
  if (/\b(apply|team|mission|culture|benefits|company|opportunity)\b/i.test(candidate) && candidate.split(/\s+/).length > 8) return false;
  return /\b(manager|engineer|developer|designer|lead|head|director|specialist|analyst|consultant|scientist|architect|product|program|operations|marketing|sales|recruiter|coordinator)\b/i.test(candidate)
    || /\bpm\b|\btpm\b/i.test(candidate);
}

export function cleanCompanyCandidate(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s+(is hiring|careers|jobs?)$/i, "")
    .trim();
}

export function isLikelyCompanyName(value: string): boolean {
  const candidate = cleanCompanyCandidate(value);
  if (!candidate || candidate.length < 2 || candidate.length > 80) return false;
  if (candidate.split(/\s+/).length > 8) return false;
  if (/[.!?]/.test(candidate)) return false;
  if (/^(join|about|what|who|our|the)\b/i.test(candidate)) return false;
  if (/\b(team|mission|culture|benefits|role|responsibilities|requirements)\b/i.test(candidate)) return false;
  return true;
}

export function cleanLocationCandidate(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\bworldwide\b/i, "Remote")
    .replace(/\bglobal\b/i, "Remote")
    .trim();
}

export function isLikelyLocation(value: string): boolean {
  const candidate = cleanLocationCandidate(value);
  if (!candidate || candidate.length > 80) return false;
  if (/[.!?]/.test(candidate)) return false;
  if (/^(join|about|what|who|our)\b/i.test(candidate)) return false;
  return /\bremote\b/i.test(candidate) || /^[A-Z][A-Za-z .'-]+(?:,\s*[A-Z][A-Za-z .'-]+)?(?:\s*\/\s*Remote)?$/.test(candidate);
}

export function preprocessJobDescription(text: string | undefined, maxChars = 12000): string | undefined {
  if (typeof text !== "string") return undefined;

  const normalized = text
    .normalize("NFKC")
    .replace(/\u00A0/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!normalized) return undefined;

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const dedupedLines = lines.filter((line, index) => {
    const lower = line.toLowerCase();
    if (/^(apply now|share this job|report this job|save job|sign in|create account|see who you know|easy apply)$/.test(lower)) {
      return false;
    }
    return lines.findIndex((candidate) => candidate.trim().toLowerCase() === lower) === index;
  });

  const compact = dedupedLines
    .filter((line) => !/^linkedin|greenhouse|lever|ashby|himalayas$/i.test(line))
    .join("\n");
  if (compact.length <= maxChars) {
    return compact;
  }

  return `${compact.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

export function inferEmploymentType(text: string): string {
  const lower = text.toLowerCase();
  if (/full[- ]time/.test(lower)) return "Full-time";
  if (/part[- ]time/.test(lower)) return "Part-time";
  if (/contract|contractor|freelance/.test(lower)) return "Contract";
  if (/intern(ship)?/.test(lower)) return "Internship";
  if (/temporary|temp role/.test(lower)) return "Temporary";
  return "";
}

export function inferPostedDate(text: string): string {
  const lower = text.toLowerCase();
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];

  const slashed = text.match(/\b(\d{1,2}\/\d{1,2}\/20\d{2})\b/);
  if (slashed) {
    const [month, day, year] = slashed[1].split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const recent = lower.match(/\bposted\s+(\d+)\s+(day|days|hour|hours)\s+ago\b/);
  if (recent) {
    return recent[0];
  }

  const simple = lower.match(/\b(today|yesterday|just posted)\b/);
  if (simple) {
    return simple[0];
  }

  return "";
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function findJobPosting(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJobPosting(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof value !== "object") return null;
  const record = value as Record<string, unknown>;

  if (record["@type"] === "JobPosting") {
    return record;
  }

  if (record["@graph"]) {
    return findJobPosting(record["@graph"]);
  }

  return null;
}

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

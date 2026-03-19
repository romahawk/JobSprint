export type IngestionSourcePlatform =
  | "greenhouse"
  | "lever"
  | "ashby"
  | "himalayas"
  | "linkedin"
  | "generic"
  | "unknown";

export type IngestionSourceType = "company" | "job" | "unknown";

export type ImportMode = "company_only" | "company_and_role";

export interface ParseInput {
  url: string;
  pastedText?: string;
  fetchHtml?: (url: string) => Promise<string>;
}

export interface ParsedImportResult {
  sourcePlatform: IngestionSourcePlatform;
  sourceType: IngestionSourceType;
  /** 0–1 confidence estimate */
  confidence: number;
  raw: {
    html?: string;
    text?: string;
    meta?: Record<string, string>;
  };
  extracted: {
    companyName?: string;
    website?: string;
    careersUrl?: string;
    industryHint?: string;
    sizeHint?: string;
    locationHint?: string;
    remotePolicyHint?: string;
    englishFirstHint?: string;
    roleTitle?: string;
    roleUrl?: string;
    roleLocation?: string;
    seniorityHint?: string;
    jobDescription?: string;
    notes?: string;
  };
}

export interface NormalizedCompanyDraft {
  name: string;
  industry: string;
  size: string;
  remotePolicy: string;
  priority: "A" | "B" | "C";
  status: "Research" | "Target" | "Active" | "Applied" | "Interviewing" | "Closed";
  notes: string;
  website?: string;
  careersUrl?: string;
  location?: string;
  englishFirst?: string;
  sourceUrl?: string;
  sourcePlatform?: string;
  importConfidence?: number;
  sourceType?: "manual" | "csv" | "link" | "generated";
}

export interface NormalizedRoleDraft {
  title: string;
  url: string;
  location: string;
  seniority: string;
  track: "TPM" | "Product Engineer" | "Systems PM";
  fitScore: 1 | 2 | 3 | 4 | 5;
  status: "to_apply" | "applied" | "interview" | "rejected" | "offer" | "closed";
  jobDescription?: string;
  sourcePlatform?: string;
  importConfidence?: number;
  sourceType?: "manual" | "csv" | "link" | "generated";
}

export interface NormalizedImportResult {
  sourcePlatform: IngestionSourcePlatform;
  sourceType: IngestionSourceType;
  confidence: number;
  company: NormalizedCompanyDraft;
  role?: NormalizedRoleDraft;
  duplicateMatch?: {
    companyId: string;
    companyName: string;
  };
}

export interface SourceAdapter {
  canHandle(url: string): boolean;
  parse(input: ParseInput): Promise<ParsedImportResult>;
}

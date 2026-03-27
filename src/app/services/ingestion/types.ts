import type {
  AiImportEnrichmentV1,
  AiImportFieldConfidence,
  AiImportIndustry,
  AiImportCompanySizeBand,
  AiImportCompanyStage,
  AiImportNextBestAction,
  AiImportPriorityBand,
  AiImportRawExtractedFields,
  AiImportReviewFlag,
  AiImportRoleTrack,
  AiImportSeniority,
  AiImportWorkplaceMode,
} from "../../types/jobOs";

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

export interface JobSourceData {
  sourceUrl: string;
  sourcePlatform: IngestionSourcePlatform;
  sourceType: IngestionSourceType;
  companyName?: string;
  rawJobTitle?: string;
  rawLocation?: string;
  rawJobDescription?: string;
  employmentType?: string;
  postedDate?: string;
  debug?: {
    titleSource?: "jsonld" | "meta" | "h1" | "selector" | "fallback";
    companySource?: "jsonld" | "meta" | "selector" | "domain" | "fallback";
    locationSource?: "jsonld" | "meta" | "selector" | "text" | "fallback";
    descriptionSource?: "jsonld" | "meta" | "selector" | "pasted_text" | "text" | "fallback";
  };
}

export interface JobImportEnrichmentRequest {
  sourceUrl?: string;
  sourcePlatform?: IngestionSourcePlatform;
  sourceType?: IngestionSourceType;
  importConfidence?: number;
  rawExtracted: AiImportRawExtractedFields;
  normalized?: {
    company?: {
      name?: string;
      industry?: string;
      size?: string;
      remotePolicy?: string;
      location?: string;
      englishFirst?: string;
    };
    role?: {
      title?: string;
      url?: string;
      location?: string;
      seniority?: string;
      track?: string;
      fitScore?: number;
      status?: string;
      nextAction?: string;
    };
  };
}

export interface JobImportEnrichmentResponse {
  schemaVersion: "ai_import_v1";
  canonicalTitle: string;
  roleTrack: AiImportRoleTrack;
  seniority: AiImportSeniority;
  industry: AiImportIndustry;
  companyStage: AiImportCompanyStage;
  companySizeBand: AiImportCompanySizeBand;
  workplaceMode: AiImportWorkplaceMode;
  fitScore: 1 | 2 | 3 | 4 | 5;
  priorityBand: AiImportPriorityBand;
  nextBestAction: AiImportNextBestAction;
  confidence: {
    overall: AiImportFieldConfidence;
    fields: Partial<
      Record<
        | "canonicalTitle"
        | "roleTrack"
        | "seniority"
        | "industry"
        | "companyStage"
        | "companySizeBand"
        | "workplaceMode"
        | "fitScore"
        | "priorityBand"
        | "nextBestAction",
        AiImportFieldConfidence
      >
    >;
  };
  reviewFlags: AiImportReviewFlag[];
  model: string;
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
  extracted: AiImportRawExtractedFields;
  aiEnrichment?: AiImportEnrichmentV1;
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
  aiEnrichment?: AiImportEnrichmentV1;
}

export interface NormalizedRoleDraft {
  title: string;
  url: string;
  location: string;
  seniority: string;
  track: "TPM" | "Product Engineer" | "Systems PM";
  fitScore: 1 | 2 | 3 | 4 | 5;
  status: "to_apply" | "applied" | "interview" | "rejected" | "offer" | "closed";
  nextAction?: string;
  jobDescription?: string;
  sourcePlatform?: string;
  importConfidence?: number;
  sourceType?: "manual" | "csv" | "link" | "generated";
  aiEnrichment?: AiImportEnrichmentV1;
}

export interface NormalizedImportResult {
  sourcePlatform: IngestionSourcePlatform;
  sourceType: IngestionSourceType;
  confidence: number;
  jobSource: JobSourceData;
  company: NormalizedCompanyDraft;
  role?: NormalizedRoleDraft;
  aiEnrichment?: AiImportEnrichmentV1;
  duplicateMatch?: {
    companyId: string;
    companyName: string;
  };
}

export interface SourceAdapter {
  canHandle(url: string): boolean;
  parse(input: ParseInput): Promise<ParsedImportResult>;
}

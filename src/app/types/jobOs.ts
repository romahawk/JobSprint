export type JobTrack = "TPM" | "Product Engineer" | "Systems PM";
export type CvTargetTrack = "TPM" | "PO" | "Implementation";
export type AiImportSchemaVersion = "ai_import_v1";
export type AiImportConfidenceLevel = "low" | "medium" | "high";
export type AiImportReviewSeverity = "info" | "review" | "warning";
export type AiImportRoleTrack = JobTrack | "Unknown";
export type AiImportSeniority =
  | "Junior"
  | "Middle"
  | "Senior"
  | "Lead"
  | "Staff"
  | "Principal"
  | "Director"
  | "VP"
  | "Executive"
  | "Unknown";
export type AiImportIndustry =
  | "AI / Data"
  | "Cybersecurity"
  | "Developer Tools"
  | "E-Commerce / Marketplace"
  | "EdTech"
  | "Fintech / Finance"
  | "Healthcare"
  | "HR / Talent"
  | "Logistics"
  | "Media / Content"
  | "PropTech"
  | "SaaS / Software"
  | "Unknown";
export type AiImportCompanySizeBand =
  | "1-10"
  | "11-50"
  | "51-200"
  | "201-500"
  | "501-1000"
  | "1001-5000"
  | "5000+"
  | "Unknown";
export type AiImportCompanyStage =
  | "Pre-seed"
  | "Seed"
  | "Series A"
  | "Series B"
  | "Series C+"
  | "Private Growth"
  | "Bootstrapped"
  | "Public"
  | "Enterprise"
  | "Unknown";
export type AiImportWorkplaceMode = "Remote" | "Hybrid" | "On-site" | "Unknown";
export type AiImportPriorityBand = CompanyPriority | "Unknown";
export type AiImportNextBestAction =
  | "Research"
  | "Tailor CV"
  | "Apply"
  | "Follow up"
  | "Network"
  | "Archive";
export type AiImportReviewFlagCode =
  | "missing_company_name"
  | "missing_role_title"
  | "missing_job_description"
  | "unclear_location"
  | "unclear_seniority"
  | "unclear_track"
  | "unclear_industry"
  | "unclear_company_size"
  | "unclear_company_stage"
  | "duplicate_company_match"
  | "low_confidence_parse"
  | "manual_review_recommended";

export interface AiImportFieldConfidence {
  score: number;
  level: AiImportConfidenceLevel;
  evidence?: string[];
  source?: "rules" | "model" | "human";
}

export interface AiImportReviewFlag {
  code: AiImportReviewFlagCode;
  severity: AiImportReviewSeverity;
  message: string;
  fieldPath?: string;
}

export interface AiImportRawExtractedFields {
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
  employmentTypeHint?: string;
  postedDateHint?: string;
  jobDescription?: string;
  notes?: string;
}

export interface AiImportNormalizedCompanyFields {
  name?: string;
  industry?: string;
  size?: string;
  remotePolicy?: string;
  location?: string;
  englishFirst?: "Yes" | "Mostly" | "Unknown";
}

export interface AiImportNormalizedRoleFields {
  title?: string;
  url?: string;
  location?: string;
  seniority?: string;
  track?: JobTrack;
  fitScore?: 1 | 2 | 3 | 4 | 5;
  status?: RoleStatus;
  nextAction?: string;
}

export interface AiImportCompanyEnrichment {
  industry?: AiImportIndustry;
  sizeBand?: AiImportCompanySizeBand;
  companyStage?: AiImportCompanyStage;
  hiringSignal?: string;
  operatingRegion?: string;
}

export interface AiImportRoleEnrichment {
  track?: AiImportRoleTrack;
  seniority?: AiImportSeniority;
  nextBestAction?: AiImportNextBestAction;
  applicationReadiness?: "ready_to_apply" | "needs_tailoring" | "needs_research";
  keyRequirements?: string[];
}

export interface AiImportEnrichmentV1 {
  schemaVersion: AiImportSchemaVersion;
  rawExtracted?: AiImportRawExtractedFields;
  normalized?: {
    company?: AiImportNormalizedCompanyFields;
    role?: AiImportNormalizedRoleFields;
  };
  enriched?: {
    company?: AiImportCompanyEnrichment;
    role?: AiImportRoleEnrichment;
  };
  confidence?: {
    overall?: AiImportFieldConfidence;
    fields?: Record<string, AiImportFieldConfidence>;
  };
  reviewFlags?: AiImportReviewFlag[];
  model?: string;
  generatedAt?: string;
}

export type CompanyPriority = "A" | "B" | "C";
export type CompanyStatus =
  | "Research"
  | "Target"
  | "Active"
  | "Applied"
  | "Interviewing"
  | "Closed";

export type RoleStatus =
  | "to_apply"
  | "applied"
  | "interview"
  | "rejected"
  | "offer"
  | "closed";

export type ApplicationStatus =
  | "sent"
  | "screen"
  | "case"
  | "interview"
  | "final"
  | "offer"
  | "rejected"
  | "ghosted";

export type OutreachStatus =
  | "sent"
  | "replied"
  | "meeting"
  | "no_reply"
  | "closed";

export interface JobOsCvAsset {
  id: string;
  name: string;
  version: string;
  fileUrl: string;
  sourceText?: string;
  sourceTextUpdatedAt?: string;
  linkedProfileId?: string;
  locked?: boolean;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobOsScriptAsset {
  id: string;
  title: string;
  scriptText: string;
  tags: string[];
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobOsTemplateAsset {
  id: string;
  title: string;
  templateText: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JobOsCompany {
  id: string;
  clientRequestId?: string;
  name: string;
  industry: string;
  size: string;
  remotePolicy: string;
  priority: CompanyPriority;
  status: CompanyStatus;
  notes: string;
  // Ingestion / import metadata (optional — backwards compatible)
  website?: string;
  careersUrl?: string;
  location?: string;
  englishFirst?: "Yes" | "Mostly" | "Unknown";
  sourceType?: "manual" | "csv" | "link" | "generated";
  sourceUrl?: string;
  sourcePlatform?: string;
  importConfidence?: number;
  aiEnrichment?: AiImportEnrichmentV1;
  // Execution engine metadata
  lastInteractionAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobOsRole {
  id: string;
  clientRequestId?: string;
  companyId: string;
  title: string;
  url: string;
  location: string;
  seniority: string;
  track: JobTrack;
  fitScore: 1 | 2 | 3 | 4 | 5;
  status: RoleStatus;
  nextAction?: string;
  nextActionDueDate?: string; // ISO date (YYYY-MM-DD) for when the next action is due
  origin?: "self_sourced" | "recruiter"; // how the candidate discovered the role
  jobDescription?: string;
  jobDescriptionUpdatedAt?: string;
  // Ingestion / import metadata (optional — backwards compatible)
  sourceType?: "manual" | "csv" | "link" | "generated";
  sourcePlatform?: string;
  importConfidence?: number;
  aiEnrichment?: AiImportEnrichmentV1;
  // Execution engine metadata
  lastInteractionAt?: string;
  hasApplication?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobOsApplication {
  id: string;
  clientRequestId?: string;
  roleId: string;
  companyId: string;
  dateApplied: string;
  channel: string;
  cvAssetId?: string;
  cvVersion: string;
  status: ApplicationStatus;
  nextAction: string;
  nextActionDueDate?: string; // ISO date (YYYY-MM-DD) for when the next action is due
  notes: string;
  latestJobDescriptionId?: string;
  latestCvTailoringRunId?: string;
  tailoredCvHeadline?: string;
  tailoredCvSummary?: string;
  tailoredCvText?: string;
  tailoredCvUpdatedAt?: string;
  aiEnrichment?: AiImportEnrichmentV1;
  // Execution engine metadata
  lastResponseAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobOsOutreach {
  id: string;
  clientRequestId?: string;
  companyId: string;
  roleId: string | null;
  contactName: string;
  contactRole: string;
  linkedinURL: string;
  scriptUsed: string;
  sentDate: string;
  status: OutreachStatus;
  followUpCount: number;
  nextFollowUpDate: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CvProfileExperienceItem {
  company: string;
  role: string;
  bullets: string[];
}

export interface CvProfile {
  id: string;
  clientRequestId?: string;
  name: string;
  targetTrack: CvTargetTrack;
  headline: string;
  summary: string;
  experience: CvProfileExperienceItem[];
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JobDescription {
  id: string;
  clientRequestId?: string;
  applicationId?: string;
  roleId?: string;
  company: string;
  title: string;
  rawText: string;
  sourceUrl?: string;
  createdAt: string;
}

export type CvTailoringMode = "analysis" | "quickTailor" | "fullTailor";

export interface CvTailoringRun {
  id: string;
  clientRequestId?: string;
  applicationId?: string;
  jobDescriptionId: string;
  cvProfileId: string;
  mode: CvTailoringMode;
  fitScore?: number;
  extractedKeywords: string[];
  strengths: string[];
  gaps: string[];
  recruiterRisks: string[];
  recommendedPositioning?: string;
  tailoredHeadline?: string;
  tailoredSummary?: string;
  rewrittenBullets?: string[];
  portfolioRecommendations?: string[];
  finalCvText?: string;
  createdAt: string;
}

export interface JobOsState {
  assets: {
    cvs: JobOsCvAsset[];
    scripts: JobOsScriptAsset[];
    templates: JobOsTemplateAsset[];
  };
  companies: JobOsCompany[];
  roles: JobOsRole[];
  applications: JobOsApplication[];
  outreach: JobOsOutreach[];
  cvProfiles: CvProfile[];
  jobDescriptions: JobDescription[];
  cvTailoringRuns: CvTailoringRun[];
}

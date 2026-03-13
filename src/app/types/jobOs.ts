export type JobTrack = "TPM" | "Product Engineer" | "Systems PM";
export type CvTargetTrack = "TPM" | "PO" | "Implementation";

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
  locked: boolean;
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
  jobDescription?: string;
  jobDescriptionUpdatedAt?: string;
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
  cvVersion: string;
  status: ApplicationStatus;
  nextAction: string;
  notes: string;
  latestJobDescriptionId?: string;
  latestCvTailoringRunId?: string;
  tailoredCvHeadline?: string;
  tailoredCvSummary?: string;
  tailoredCvText?: string;
  tailoredCvUpdatedAt?: string;
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

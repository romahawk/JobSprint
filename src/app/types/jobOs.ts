export type JobTrack = "TPM" | "Product Engineer" | "Systems PM";

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
  companyId: string;
  title: string;
  url: string;
  location: string;
  seniority: string;
  track: JobTrack;
  fitScore: 1 | 2 | 3 | 4 | 5;
  status: RoleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface JobOsApplication {
  id: string;
  roleId: string;
  companyId: string;
  dateApplied: string;
  channel: string;
  cvVersion: string;
  status: ApplicationStatus;
  nextAction: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobOsOutreach {
  id: string;
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
}

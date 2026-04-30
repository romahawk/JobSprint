import type {
  CvProfile,
  CvTailoringRun,
  JobDescription,
  JobOsApplication,
  JobOsCompany,
  JobOsCvAsset,
  JobSource,
  JobOsScriptAsset,
  JobOsState,
  JobOsTemplateAsset,
  SavedSearch,
} from "../types/jobOs";
import { normalizeCvDefaults } from "./cvAssets";

export const DEFAULT_CV_PROFILES: CvProfile[] = [
  {
    id: "cv-profile-tpm-core",
    name: "TPM Core Profile",
    targetTrack: "TPM",
    headline: "Technical Product and Delivery Leader",
    summary:
      "Bridge product strategy, implementation delivery, and cross-functional execution for complex digital products.",
    experience: [],
    skills: [
      "Stakeholder management",
      "Product operations",
      "Implementation delivery",
      "Workflow optimization",
      "Cross-functional leadership",
    ],
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "cv-profile-po-ops",
    name: "PO / Product Ops Profile",
    targetTrack: "PO",
    headline: "Product Operations and Process Builder",
    summary:
      "Translate business needs into scalable workflows, product requirements, and delivery systems that improve execution.",
    experience: [],
    skills: [
      "Backlog management",
      "Process design",
      "Requirements gathering",
      "Operational analytics",
      "Team coordination",
    ],
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "cv-profile-implementation",
    name: "Implementation / Solutions Profile",
    targetTrack: "Implementation",
    headline: "Implementation and Solutions Manager",
    summary:
      "Lead onboarding, systems rollout, and operational adoption across technical and customer-facing implementation programs.",
    experience: [],
    skills: [
      "Client onboarding",
      "Systems implementation",
      "Process training",
      "Solution design",
      "Operational rollout",
    ],
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
];

export const EMPTY_JOB_OS_STATE: JobOsState = {
  assets: { cvs: [], scripts: [], templates: [] },
  sources: [],
  savedSearches: [],
  companies: [],
  roles: [],
  applications: [],
  outreach: [],
  cvProfiles: DEFAULT_CV_PROFILES,
  jobDescriptions: [],
  cvTailoringRuns: [],
};

export const JOB_OS_COLLECTION_KEYS = [
  "sources",
  "savedSearches",
  "companies",
  "roles",
  "applications",
  "outreach",
  "cvProfiles",
  "jobDescriptions",
  "cvTailoringRuns",
] as const;

export type JobOsCollectionKey = (typeof JOB_OS_COLLECTION_KEYS)[number];

function asIso(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function withTimestamps<T extends Record<string, unknown>>(record: T): T {
  return {
    ...record,
    createdAt: asIso(record.createdAt),
    updatedAt: asIso(record.updatedAt),
  };
}

export function normalizeJobOsState(raw: unknown): JobOsState {
  if (!raw || typeof raw !== "object") return EMPTY_JOB_OS_STATE;
  const maybe = raw as Partial<JobOsState>;
  const cvs = Array.isArray(maybe.assets?.cvs)
    ? (maybe.assets?.cvs.map((value) =>
        withTimestamps(value as Record<string, unknown>)
      ) as JobOsCvAsset[])
    : [];
  const normalizedCvs = normalizeCvDefaults(cvs);
  const profiles = Array.isArray(maybe.cvProfiles)
    ? (maybe.cvProfiles.map((value) =>
        withTimestamps(value as Record<string, unknown>)
      ) as CvProfile[])
    : DEFAULT_CV_PROFILES;
  const completeProfiles = DEFAULT_CV_PROFILES.map((base) => {
    const found = profiles.find((profile) => profile.id === base.id);
    return found ? { ...base, ...found } : base;
  });
  const customProfiles = profiles.filter(
    (profile) => !DEFAULT_CV_PROFILES.some((base) => base.id === profile.id)
  );

  return {
    assets: {
      cvs: normalizedCvs,
      scripts: Array.isArray(maybe.assets?.scripts)
        ? (maybe.assets.scripts.map((value) =>
            withTimestamps(value as Record<string, unknown>)
          ) as JobOsScriptAsset[])
        : [],
      templates: Array.isArray(maybe.assets?.templates)
        ? (maybe.assets.templates.map((value) =>
            withTimestamps(value as Record<string, unknown>)
          ) as JobOsTemplateAsset[])
        : [],
    },
    sources: Array.isArray(maybe.sources)
      ? (maybe.sources.map((value) =>
          withTimestamps(value as Record<string, unknown>)
        ) as JobSource[])
      : [],
    savedSearches: Array.isArray(maybe.savedSearches)
      ? (maybe.savedSearches.map((value) =>
          withTimestamps(value as Record<string, unknown>)
        ) as SavedSearch[])
      : [],
    companies: Array.isArray(maybe.companies)
      ? (maybe.companies.map((value) =>
          withTimestamps(value as Record<string, unknown>)
        ) as JobOsCompany[])
      : [],
    roles: Array.isArray(maybe.roles)
      ? (maybe.roles.map((value) =>
          withTimestamps(value as Record<string, unknown>)
        ) as JobOsState["roles"])
      : [],
    applications: Array.isArray(maybe.applications)
      ? (maybe.applications.map((value) => {
          const normalized = withTimestamps(value as Record<string, unknown>) as JobOsApplication;
          const matchedCv = normalized.cvAssetId
            ? normalizedCvs.find((cv) => cv.id === normalized.cvAssetId)
            : normalizedCvs.find((cv) => cv.name === normalized.cvVersion);
          return {
            ...normalized,
            cvAssetId: matchedCv?.id ?? (typeof normalized.cvAssetId === "string" ? normalized.cvAssetId : undefined),
            cvVersion: matchedCv?.name ?? String(normalized.cvVersion ?? ""),
          };
        }) as JobOsState["applications"])
      : [],
    outreach: Array.isArray(maybe.outreach)
      ? (maybe.outreach.map((value) =>
          withTimestamps(value as Record<string, unknown>)
        ) as JobOsState["outreach"])
      : [],
    cvProfiles: [...completeProfiles, ...customProfiles],
    jobDescriptions: Array.isArray(maybe.jobDescriptions)
      ? (maybe.jobDescriptions.map((value) => ({
          ...(value as Record<string, unknown>),
          id: String((value as { id?: string }).id ?? ""),
          company: String((value as { company?: string }).company ?? ""),
          title: String((value as { title?: string }).title ?? ""),
          rawText: String((value as { rawText?: string }).rawText ?? ""),
          sourceUrl: String((value as { sourceUrl?: string }).sourceUrl ?? ""),
          applicationId:
            typeof (value as { applicationId?: string }).applicationId === "string"
              ? (value as { applicationId?: string }).applicationId
              : undefined,
          roleId:
            typeof (value as { roleId?: string }).roleId === "string"
              ? (value as { roleId?: string }).roleId
              : undefined,
          clientRequestId:
            typeof (value as { clientRequestId?: string }).clientRequestId === "string"
              ? (value as { clientRequestId?: string }).clientRequestId
              : undefined,
          createdAt: asIso((value as { createdAt?: unknown }).createdAt),
        })) as JobDescription[])
      : [],
    cvTailoringRuns: Array.isArray(maybe.cvTailoringRuns)
      ? (maybe.cvTailoringRuns.map((value) => ({
          ...(value as Record<string, unknown>),
          id: String((value as { id?: string }).id ?? ""),
          mode: (value as { mode?: CvTailoringRun["mode"] }).mode ?? "analysis",
          jobDescriptionId: String(
            (value as { jobDescriptionId?: string }).jobDescriptionId ?? ""
          ),
          cvProfileId: String((value as { cvProfileId?: string }).cvProfileId ?? ""),
          extractedKeywords: Array.isArray(
            (value as { extractedKeywords?: unknown[] }).extractedKeywords
          )
            ? (value as { extractedKeywords: string[] }).extractedKeywords
            : [],
          strengths: Array.isArray((value as { strengths?: unknown[] }).strengths)
            ? (value as { strengths: string[] }).strengths
            : [],
          gaps: Array.isArray((value as { gaps?: unknown[] }).gaps)
            ? (value as { gaps: string[] }).gaps
            : [],
          recruiterRisks: Array.isArray(
            (value as { recruiterRisks?: unknown[] }).recruiterRisks
          )
            ? (value as { recruiterRisks: string[] }).recruiterRisks
            : [],
          rewrittenBullets: Array.isArray(
            (value as { rewrittenBullets?: unknown[] }).rewrittenBullets
          )
            ? (value as { rewrittenBullets: string[] }).rewrittenBullets
            : [],
          portfolioRecommendations: Array.isArray(
            (value as { portfolioRecommendations?: unknown[] }).portfolioRecommendations
          )
            ? (value as { portfolioRecommendations: string[] }).portfolioRecommendations
            : [],
          createdAt: asIso((value as { createdAt?: unknown }).createdAt),
        })) as CvTailoringRun[])
      : [],
  };
}

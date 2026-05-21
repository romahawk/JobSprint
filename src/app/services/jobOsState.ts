import type {
  CvProfile,
  CvTailoringRun,
  JobDescription,
  JobOsApplication,
  JobOsCompany,
  JobOsCvAsset,
  JobOsOutreach,
  JobOsRole,
  JobSource,
  JobOsScriptAsset,
  JobOsState,
  JobOsTemplateAsset,
  SavedSearch,
} from "../types/jobOs";
import { normalizeCvDefaults } from "./cvAssets";

const DEFAULT_DISCOVERY_TIMESTAMP = new Date(0).toISOString();

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

export const DEFAULT_JOB_SOURCES: JobSource[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    url: "https://www.linkedin.com/jobs/",
    category: "general",
    priority: "A",
    bestFor: "Broad market scan, recruiters, TPM/Product roles",
    cadence: "daily",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "wellfound",
    name: "Wellfound",
    url: "https://wellfound.com/jobs",
    category: "startup",
    priority: "A",
    bestFor: "Startups, remote-first product and builder roles",
    cadence: "twice_weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "my-greenhouse",
    name: "MyGreenhouse",
    url: "https://my.greenhouse.com/",
    category: "ats",
    priority: "A",
    bestFor: "Direct ATS discovery and company pipelines",
    cadence: "twice_weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "we-work-remotely",
    name: "We Work Remotely",
    url: "https://weworkremotely.com/",
    category: "remote",
    priority: "B",
    bestFor: "Remote-first product, operations, and technical roles",
    cadence: "twice_weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "himalayas",
    name: "Himalayas",
    url: "https://himalayas.app/jobs",
    category: "remote",
    priority: "B",
    bestFor: "Remote roles, structured discovery, and async-friendly companies",
    cadence: "twice_weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "remote-ok",
    name: "Remote OK",
    url: "https://remoteok.com/",
    category: "remote",
    priority: "B",
    bestFor: "Remote tech and startup roles",
    cadence: "weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "glassdoor",
    name: "Glassdoor",
    url: "https://www.glassdoor.com/Job/index.htm",
    category: "research",
    priority: "B",
    bestFor: "Company research, salaries, interview signals, and reviews",
    cadence: "weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "indeed-germany",
    name: "Indeed Germany",
    url: "https://de.indeed.com/",
    category: "general",
    priority: "C",
    bestFor: "Local German market scan and English-speaking role checks",
    cadence: "weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "welcome-to-the-jungle",
    name: "Welcome to the Jungle",
    url: "https://www.welcometothejungle.com/en/jobs",
    category: "startup",
    priority: "B",
    bestFor: "European startups, scaleups, and product roles",
    cadence: "weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "otta",
    name: "Otta / Welcome to the Jungle Legacy",
    url: "https://app.otta.com/",
    category: "startup",
    priority: "C",
    bestFor: "Legacy Otta-style startup discovery; keep only if still useful",
    cadence: "manual",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "stepstone-germany",
    name: "StepStone Germany",
    url: "https://www.stepstone.de/",
    category: "general",
    priority: "C",
    bestFor: "German corporate market scan",
    cadence: "weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "arbeitnow",
    name: "Arbeitnow",
    url: "https://www.arbeitnow.com/",
    category: "general",
    priority: "B",
    bestFor: "Germany-based tech jobs and English-friendly openings",
    cadence: "weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "eu-startups",
    name: "EU-Startups Jobs",
    url: "https://www.eu-startups.com/jobs/",
    category: "startup",
    priority: "B",
    bestFor: "European startup roles and early-stage opportunities",
    cadence: "weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "yc-jobs",
    name: "Y Combinator Jobs",
    url: "https://www.ycombinator.com/jobs",
    category: "startup",
    priority: "B",
    bestFor: "High-growth startup roles and product-builder opportunities",
    cadence: "weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "work-at-a-startup",
    name: "Workatastartup",
    url: "https://www.workatastartup.com/",
    category: "startup",
    priority: "B",
    bestFor: "YC startup jobs and founder-led hiring",
    cadence: "weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "levels-fyi",
    name: "Levels.fyi Jobs",
    url: "https://www.levels.fyi/jobs/",
    category: "research",
    priority: "C",
    bestFor: "Compensation research and senior tech role benchmarking",
    cadence: "manual",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "cord",
    name: "Otta Alternatives / Cord",
    url: "https://cord.co/",
    category: "startup",
    priority: "C",
    bestFor: "Startup hiring and direct company discovery if available in target market",
    cadence: "manual",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "company-career-pages",
    name: "Company Career Pages",
    url: "https://www.google.com/search?q=site%3Agreenhouse.io+technical+product+manager+remote+europe",
    category: "company_career",
    priority: "A",
    bestFor: "Direct company career-page discovery via targeted search operators",
    cadence: "twice_weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "greenhouse-public-boards",
    name: "Greenhouse Public Boards",
    url: "https://www.google.com/search?q=site%3Agreenhouse.io+%22Technical+Product+Manager%22+remote",
    category: "ats",
    priority: "A",
    bestFor: "Direct Greenhouse-hosted role discovery",
    cadence: "twice_weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "ashby-public-boards",
    name: "Ashby Public Boards",
    url: "https://www.google.com/search?q=site%3Aashbyhq.com+%22Technical+Product+Manager%22+remote",
    category: "ats",
    priority: "A",
    bestFor: "Direct Ashby-hosted startup and scaleup role discovery",
    cadence: "twice_weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "lever-public-boards",
    name: "Lever Public Boards",
    url: "https://www.google.com/search?q=site%3Alever.co+%22Technical+Product+Manager%22+remote",
    category: "ats",
    priority: "A",
    bestFor: "Direct Lever-hosted company role discovery",
    cadence: "twice_weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "google-jobs-search",
    name: "Google Jobs Search",
    url: "https://www.google.com/search?q=Technical+Product+Manager+remote+Europe+jobs",
    category: "general",
    priority: "B",
    bestFor: "Meta-search across boards, ATS pages, and company career pages",
    cadence: "weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
];

export const DEFAULT_SAVED_SEARCHES: SavedSearch[] = [
  {
    id: "tpm-remote-europe",
    sourceId: "linkedin",
    name: "TPM Remote Europe",
    query: "Technical Product Manager remote Europe",
    url: "https://www.linkedin.com/jobs/search/?keywords=Technical%20Product%20Manager&location=Europe&f_WT=2",
    targetTrack: "TPM",
    priority: "A",
    cadence: "daily",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "ai-product-manager-germany",
    sourceId: "linkedin",
    name: "AI Product Manager Germany",
    query: "AI Product Manager Germany English",
    url: "https://www.linkedin.com/jobs/search/?keywords=AI%20Product%20Manager&location=Germany",
    targetTrack: "AI Product",
    priority: "A",
    cadence: "daily",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "product-engineer-remote",
    sourceId: "wellfound",
    name: "Product Engineer Remote",
    query: "Product Engineer remote",
    url: "https://wellfound.com/jobs",
    targetTrack: "Product Engineer",
    priority: "A",
    cadence: "twice_weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "medtech-product-germany",
    sourceId: "linkedin",
    name: "MedTech Product Germany",
    query: "Product Manager MedTech Germany",
    url: "https://www.linkedin.com/jobs/search/?keywords=Product%20Manager%20MedTech&location=Germany",
    targetTrack: "MedTech Product",
    priority: "A",
    cadence: "twice_weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "implementation-solutions-manager-germany",
    sourceId: "linkedin",
    name: "Implementation / Solutions Manager Germany",
    query: "Implementation Manager OR Solutions Manager Germany English",
    url: "https://www.linkedin.com/jobs/search/?keywords=Implementation%20Manager%20Solutions%20Manager&location=Germany",
    targetTrack: "Implementation",
    priority: "A",
    cadence: "twice_weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "remote-product-roles",
    sourceId: "we-work-remotely",
    name: "Remote Product Roles",
    query: "product manager remote",
    url: "https://weworkremotely.com/remote-product-jobs",
    targetTrack: "TPM",
    priority: "B",
    cadence: "twice_weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "english-speaking-product-germany",
    sourceId: "indeed-germany",
    name: "English-speaking Product Germany",
    query: "English Product Manager Germany",
    url: "https://de.indeed.com/q-english-product-manager-jobs.html",
    targetTrack: "TPM",
    priority: "C",
    cadence: "weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "greenhouse-tpm-remote",
    sourceId: "greenhouse-public-boards",
    name: "Greenhouse TPM Remote",
    query: 'site:greenhouse.io "Technical Product Manager" remote',
    url: "https://www.google.com/search?q=site%3Agreenhouse.io+%22Technical+Product+Manager%22+remote",
    targetTrack: "TPM",
    priority: "A",
    cadence: "twice_weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "ashby-tpm-remote",
    sourceId: "ashby-public-boards",
    name: "Ashby TPM Remote",
    query: 'site:ashbyhq.com "Technical Product Manager" remote',
    url: "https://www.google.com/search?q=site%3Aashbyhq.com+%22Technical+Product+Manager%22+remote",
    targetTrack: "TPM",
    priority: "A",
    cadence: "twice_weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "lever-tpm-remote",
    sourceId: "lever-public-boards",
    name: "Lever TPM Remote",
    query: 'site:lever.co "Technical Product Manager" remote',
    url: "https://www.google.com/search?q=site%3Alever.co+%22Technical+Product+Manager%22+remote",
    targetTrack: "TPM",
    priority: "A",
    cadence: "twice_weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "ai-systems-product-roles",
    sourceId: "google-jobs-search",
    name: "AI Systems Product Roles",
    query: "AI Systems Product Manager remote Europe",
    url: "https://www.google.com/search?q=AI+Systems+Product+Manager+remote+Europe+jobs",
    targetTrack: "AI Product",
    priority: "A",
    cadence: "twice_weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "medtech-digital-product-europe",
    sourceId: "google-jobs-search",
    name: "MedTech Digital Product Europe",
    query: "MedTech Digital Product Manager Europe English",
    url: "https://www.google.com/search?q=MedTech+Digital+Product+Manager+Europe+English+jobs",
    targetTrack: "MedTech Product",
    priority: "A",
    cadence: "twice_weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "remote-startup-product-roles",
    sourceId: "yc-jobs",
    name: "Remote Startup Product Roles",
    query: "product remote startup",
    url: "https://www.ycombinator.com/jobs",
    targetTrack: "Product Engineer",
    priority: "B",
    cadence: "weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "germany-tech-jobs-english",
    sourceId: "arbeitnow",
    name: "Germany Tech Jobs English",
    query: "English tech jobs Germany",
    url: "https://www.arbeitnow.com/",
    targetTrack: "Other",
    priority: "B",
    cadence: "weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
  {
    id: "european-startup-product-jobs",
    sourceId: "welcome-to-the-jungle",
    name: "European Startup Product Jobs",
    query: "Product Manager Europe startup",
    url: "https://www.welcometothejungle.com/en/jobs",
    targetTrack: "TPM",
    priority: "B",
    cadence: "weekly",
    active: true,
    notes: "",
    createdAt: DEFAULT_DISCOVERY_TIMESTAMP,
    updatedAt: DEFAULT_DISCOVERY_TIMESTAMP,
  },
];

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

function isNullish(value: unknown): boolean {
  return value === undefined || value === null;
}

function mergeMissingFields<T extends Record<string, unknown>>(defaults: T, existing: T): T {
  const merged: Record<string, unknown> = { ...existing };

  for (const [key, value] of Object.entries(defaults)) {
    if (isNullish(merged[key])) {
      merged[key] = value;
    }
  }

  return merged as T;
}

function lookupKey(item: { id: string; name?: string }): string {
  return typeof item.name === "string" && item.name.trim().length > 0
    ? item.name.trim().toLowerCase()
    : item.id;
}

export function mergeDefaultsById<T extends { id: string; name?: string }>(
  existing: T[] | undefined,
  defaults: T[]
): T[] {
  const existingItems = existing ?? [];
  const defaultById = new Map(defaults.map((item) => [item.id, item]));
  const defaultByLookup = new Map(defaults.map((item) => [lookupKey(item), item]));
  const matchedDefaultIds = new Set<string>();
  const mergedExisting = existingItems.map((item) => {
    const matchedDefault = defaultById.get(item.id) ?? defaultByLookup.get(lookupKey(item));
    if (!matchedDefault) {
      return item;
    }

    matchedDefaultIds.add(matchedDefault.id);
    return mergeMissingFields(matchedDefault as T, item);
  });
  const missingDefaults = defaults
    .filter((item) => !matchedDefaultIds.has(item.id))
    .map((item) => ({ ...item }));

  return [...mergedExisting, ...missingDefaults];
}

function resolveDefaultSources(existing: JobSource[] | undefined): JobSource[] {
  return mergeDefaultsById(existing, DEFAULT_JOB_SOURCES);
}

function buildSourceIdResolutionMap(sources: JobSource[]): Map<string, string> {
  const resolution = new Map<string, string>();
  const byLookup = new Map(sources.map((source) => [lookupKey(source), source.id]));

  for (const defaultSource of DEFAULT_JOB_SOURCES) {
    resolution.set(
      defaultSource.id,
      byLookup.get(lookupKey(defaultSource)) ?? defaultSource.id
    );
  }

  return resolution;
}

function resolveDefaultSavedSearches(
  existing: SavedSearch[] | undefined,
  sources: JobSource[]
): SavedSearch[] {
  const sourceIdResolution = buildSourceIdResolutionMap(sources);
  const resolvedDefaults = DEFAULT_SAVED_SEARCHES.map((search) => ({
    ...search,
    sourceId: sourceIdResolution.get(search.sourceId) ?? search.sourceId,
  }));

  return mergeDefaultsById(existing, resolvedDefaults);
}

export function normalizeJobOsState(raw: unknown): JobOsState {
  if (!raw || typeof raw !== "object") {
    return {
      ...EMPTY_JOB_OS_STATE,
      sources: DEFAULT_JOB_SOURCES.map((source) => ({ ...source })),
      savedSearches: DEFAULT_SAVED_SEARCHES.map((search) => ({ ...search })),
    };
  }
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
  const normalizedSources = resolveDefaultSources(
    Array.isArray(maybe.sources)
      ? (maybe.sources.map((value) =>
          withTimestamps(value as Record<string, unknown>)
        ) as JobSource[])
      : []
  );
  const normalizedSavedSearches = resolveDefaultSavedSearches(
    Array.isArray(maybe.savedSearches)
      ? (maybe.savedSearches.map((value) =>
          withTimestamps(value as Record<string, unknown>)
        ) as SavedSearch[])
      : [],
    normalizedSources
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
    sources: normalizedSources,
    savedSearches: normalizedSavedSearches,
    companies: Array.isArray(maybe.companies)
      ? (maybe.companies.map((value) => {
          const normalized = withTimestamps(value as Record<string, unknown>) as JobOsCompany;
          return { ...normalized, archived: normalized.archived === true };
        }) as JobOsCompany[])
      : [],
    roles: Array.isArray(maybe.roles)
      ? (maybe.roles.map((value) => {
          const normalized = withTimestamps(value as Record<string, unknown>) as JobOsRole;
          return { ...normalized, archived: normalized.archived === true };
        }) as JobOsState["roles"])
      : [],
    applications: Array.isArray(maybe.applications)
      ? (maybe.applications.map((value) => {
          const normalized = withTimestamps(value as Record<string, unknown>) as JobOsApplication;
          const matchedCv = normalized.cvAssetId
            ? normalizedCvs.find((cv) => cv.id === normalized.cvAssetId)
            : normalizedCvs.find((cv) => cv.name === normalized.cvVersion);
          return {
            ...normalized,
            archived: normalized.archived === true,
            cvAssetId: matchedCv?.id ?? (typeof normalized.cvAssetId === "string" ? normalized.cvAssetId : undefined),
            cvVersion: matchedCv?.name ?? String(normalized.cvVersion ?? ""),
          };
        }) as JobOsState["applications"])
      : [],
    outreach: Array.isArray(maybe.outreach)
      ? (maybe.outreach.map((value) => {
          const normalized = withTimestamps(value as Record<string, unknown>) as JobOsOutreach;
          return { ...normalized, archived: normalized.archived === true };
        }) as JobOsState["outreach"])
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

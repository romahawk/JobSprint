import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseContext } from "../services/firebase";
import {
  resetJobOsSyncSnapshot,
  updateJobOsSyncSnapshot,
} from "../services/jobOsSync";
import type {
  CvProfile,
  CvTailoringRun,
  JobDescription,
  JobOsApplication,
  JobOsCompany,
  JobOsCvAsset,
  JobOsOutreach,
  JobOsRole,
  JobOsScriptAsset,
  JobOsState,
  JobOsTemplateAsset,
} from "../types/jobOs";

const LOCAL_KEY_PREFIX = "job_os_v1";
const MUTATION_TIMEOUT_MS = 12000;

const DEFAULT_CVS: JobOsCvAsset[] = [
  {
    id: "cv-tpm",
    name: "CV - Technical Product Manager",
    version: "v1.0",
    fileUrl: "",
    sourceText: "",
    sourceTextUpdatedAt: "",
    linkedProfileId: "cv-profile-tpm-core",
    locked: true,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "cv-product-engineer",
    name: "CV - Product Engineer",
    version: "v1.0",
    fileUrl: "",
    sourceText: "",
    sourceTextUpdatedAt: "",
    linkedProfileId: "cv-profile-po-ops",
    locked: true,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "cv-systems-pm",
    name: "CV - Systems / Platform PM",
    version: "v1.0",
    fileUrl: "",
    sourceText: "",
    sourceTextUpdatedAt: "",
    linkedProfileId: "cv-profile-implementation",
    locked: true,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
];
const DEFAULT_CV_PROFILES: CvProfile[] = [
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

const EMPTY_STATE: JobOsState = {
  assets: { cvs: DEFAULT_CVS, scripts: [], templates: [] },
  companies: [],
  roles: [],
  applications: [],
  outreach: [],
  cvProfiles: DEFAULT_CV_PROFILES,
  jobDescriptions: [],
  cvTailoringRuns: [],
};

function normalizeCompanyName(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\u00A0/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function companyFreshness(company: JobOsCompany): number {
  const updated = Date.parse(company.updatedAt || "");
  if (!Number.isNaN(updated)) return updated;
  const created = Date.parse(company.createdAt || "");
  if (!Number.isNaN(created)) return created;
  return 0;
}

function dedupeCompanies(items: JobOsCompany[]): JobOsCompany[] {
  const byName = new Map<string, JobOsCompany>();
  for (const company of items) {
    const key = normalizeCompanyName(company.name);
    if (!key) {
      byName.set(`__${company.id}`, company);
      continue;
    }
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, company);
      continue;
    }
    if (companyFreshness(company) >= companyFreshness(existing)) {
      byName.set(key, company);
    }
  }
  return Array.from(byName.values());
}

function localKey(userId: string): string {
  return `${LOCAL_KEY_PREFIX}_${userId}`;
}

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

function normalizeState(raw: unknown): JobOsState {
  if (!raw || typeof raw !== "object") return EMPTY_STATE;
  const maybe = raw as Partial<JobOsState>;
  const cvs = Array.isArray(maybe.assets?.cvs)
    ? maybe.assets?.cvs.map((v) =>
        withTimestamps(v as Record<string, unknown>)
      )
    : DEFAULT_CVS;
  const completeCvs = DEFAULT_CVS.map((base) => {
    const found = cvs.find((c) => c.id === base.id);
    if (!found) return base;
    return {
      ...base,
      ...found,
      locked: true,
    };
  });
  const profiles = Array.isArray(maybe.cvProfiles)
    ? (maybe.cvProfiles.map((v) =>
        withTimestamps(v as Record<string, unknown>)
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
      cvs: completeCvs as JobOsCvAsset[],
      scripts: Array.isArray(maybe.assets?.scripts)
        ? (maybe.assets.scripts.map((v) =>
            withTimestamps(v as Record<string, unknown>)
          ) as JobOsScriptAsset[])
        : [],
      templates: Array.isArray(maybe.assets?.templates)
        ? (maybe.assets.templates.map((v) =>
            withTimestamps(v as Record<string, unknown>)
          ) as JobOsTemplateAsset[])
        : [],
    },
    companies: Array.isArray(maybe.companies)
      ? (maybe.companies.map((v) =>
          withTimestamps(v as Record<string, unknown>)
        ) as JobOsCompany[])
      : [],
    roles: Array.isArray(maybe.roles)
      ? (maybe.roles.map((v) =>
          withTimestamps(v as Record<string, unknown>)
        ) as JobOsRole[])
      : [],
    applications: Array.isArray(maybe.applications)
      ? (maybe.applications.map((v) =>
          withTimestamps(v as Record<string, unknown>)
        ) as JobOsApplication[])
      : [],
    outreach: Array.isArray(maybe.outreach)
      ? (maybe.outreach.map((v) =>
          withTimestamps(v as Record<string, unknown>)
        ) as JobOsOutreach[])
      : [],
    cvProfiles: [...completeProfiles, ...customProfiles],
    jobDescriptions: Array.isArray(maybe.jobDescriptions)
      ? (maybe.jobDescriptions.map((v) => ({
          ...(v as Record<string, unknown>),
          id: String((v as { id?: string }).id ?? ""),
          company: String((v as { company?: string }).company ?? ""),
          title: String((v as { title?: string }).title ?? ""),
          rawText: String((v as { rawText?: string }).rawText ?? ""),
          sourceUrl: String((v as { sourceUrl?: string }).sourceUrl ?? ""),
          applicationId:
            typeof (v as { applicationId?: string }).applicationId === "string"
              ? (v as { applicationId?: string }).applicationId
              : undefined,
          roleId:
            typeof (v as { roleId?: string }).roleId === "string"
              ? (v as { roleId?: string }).roleId
              : undefined,
          clientRequestId:
            typeof (v as { clientRequestId?: string }).clientRequestId === "string"
              ? (v as { clientRequestId?: string }).clientRequestId
              : undefined,
          createdAt: asIso((v as { createdAt?: unknown }).createdAt),
        })) as JobDescription[])
      : [],
    cvTailoringRuns: Array.isArray(maybe.cvTailoringRuns)
      ? (maybe.cvTailoringRuns.map((v) => ({
          ...(v as Record<string, unknown>),
          id: String((v as { id?: string }).id ?? ""),
          mode: (v as { mode?: CvTailoringRun["mode"] }).mode ?? "analysis",
          jobDescriptionId: String(
            (v as { jobDescriptionId?: string }).jobDescriptionId ?? ""
          ),
          cvProfileId: String((v as { cvProfileId?: string }).cvProfileId ?? ""),
          extractedKeywords: Array.isArray(
            (v as { extractedKeywords?: unknown[] }).extractedKeywords
          )
            ? (v as { extractedKeywords: string[] }).extractedKeywords
            : [],
          strengths: Array.isArray((v as { strengths?: unknown[] }).strengths)
            ? (v as { strengths: string[] }).strengths
            : [],
          gaps: Array.isArray((v as { gaps?: unknown[] }).gaps)
            ? (v as { gaps: string[] }).gaps
            : [],
          recruiterRisks: Array.isArray(
            (v as { recruiterRisks?: unknown[] }).recruiterRisks
          )
            ? (v as { recruiterRisks: string[] }).recruiterRisks
            : [],
          rewrittenBullets: Array.isArray(
            (v as { rewrittenBullets?: unknown[] }).rewrittenBullets
          )
            ? (v as { rewrittenBullets: string[] }).rewrittenBullets
            : [],
          portfolioRecommendations: Array.isArray(
            (v as { portfolioRecommendations?: unknown[] }).portfolioRecommendations
          )
            ? (v as { portfolioRecommendations: string[] }).portfolioRecommendations
            : [],
          createdAt: asIso((v as { createdAt?: unknown }).createdAt),
        })) as CvTailoringRun[])
      : [],
  };
}

function readLocal(userId: string): JobOsState {
  try {
    const raw = localStorage.getItem(localKey(userId));
    if (!raw) return EMPTY_STATE;
    return normalizeState(JSON.parse(raw));
  } catch {
    return EMPTY_STATE;
  }
}

function writeLocal(userId: string, state: JobOsState): void {
  localStorage.setItem(localKey(userId), JSON.stringify(state));
}

function randomId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function requestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function pendingLocalId(prefix: string, clientRequestId: string): string {
  return `local-${prefix}-${clientRequestId}`;
}

function isPendingLocalItem(value: unknown): value is { id: string; clientRequestId?: string } {
  return (
    !!value &&
    typeof value === "object" &&
    "id" in value &&
    typeof (value as { id: string }).id === "string" &&
    (value as { id: string }).id.startsWith("local-")
  );
}

function mergePendingLocalItems<T extends { id: string; clientRequestId?: string }>(
  remoteItems: T[],
  latestLocal: T[]
): T[] {
  const remoteRequestIds = new Set(
    remoteItems
      .map((item) => item.clientRequestId)
      .filter((value): value is string => typeof value === "string" && value.length > 0)
  );
  const pendingLocals = latestLocal.filter(
    (item) =>
      isPendingLocalItem(item) &&
      (!item.clientRequestId || !remoteRequestIds.has(item.clientRequestId))
  );
  return [...remoteItems, ...pendingLocals];
}

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${MUTATION_TIMEOUT_MS}ms`));
    }, MUTATION_TIMEOUT_MS);
    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

function isOfflineLike(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("timed out") ||
    message.includes("offline") ||
    message.includes("network") ||
    message.includes("unavailable")
  );
}

function collectionDoc<T extends { id: string }>(
  state: JobOsState,
  key:
    | "companies"
    | "roles"
    | "applications"
    | "outreach"
    | "cvProfiles"
    | "jobDescriptions"
    | "cvTailoringRuns",
  id: string,
  updater: (existing: T) => T
): JobOsState {
  return {
    ...state,
    [key]: (state[key] as T[]).map((item) =>
      item.id === id ? updater(item) : item
    ),
  } as JobOsState;
}

interface UseJobOsReturn extends JobOsState {
  loading: boolean;
  syncNotice: string | null;
  pendingWrites: number;
  lastSyncedAt: string | null;
  storageMode: "firebase" | "local";
  updateCv: (
    id: string,
    updates: Partial<Pick<JobOsCvAsset, "version" | "fileUrl" | "sourceText" | "sourceTextUpdatedAt" | "linkedProfileId">>
  ) => Promise<void>;
  addScript: (payload: Omit<JobOsScriptAsset, "id" | "createdAt" | "updatedAt" | "lastUpdated">) => Promise<void>;
  addTemplate: (payload: Omit<JobOsTemplateAsset, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  addCompany: (payload: Omit<JobOsCompany, "id" | "createdAt" | "updatedAt">) => Promise<string | null>;
  updateCompany: (id: string, updates: Partial<JobOsCompany>) => Promise<void>;
  addRole: (payload: Omit<JobOsRole, "id" | "createdAt" | "updatedAt">) => Promise<string | null>;
  updateRole: (id: string, updates: Partial<JobOsRole>) => Promise<void>;
  addApplication: (payload: Omit<JobOsApplication, "id" | "createdAt" | "updatedAt">) => Promise<string | null>;
  updateApplication: (id: string, updates: Partial<JobOsApplication>) => Promise<void>;
  addOutreach: (payload: Omit<JobOsOutreach, "id" | "createdAt" | "updatedAt">) => Promise<string | null>;
  updateOutreach: (id: string, updates: Partial<JobOsOutreach>) => Promise<void>;
  addCvProfile: (payload: Omit<CvProfile, "id" | "createdAt" | "updatedAt">) => Promise<string | null>;
  updateCvProfile: (id: string, updates: Partial<CvProfile>) => Promise<void>;
  addJobDescription: (payload: Omit<JobDescription, "id" | "createdAt">) => Promise<string | null>;
  updateJobDescription: (id: string, updates: Partial<JobDescription>) => Promise<void>;
  addCvTailoringRun: (payload: Omit<CvTailoringRun, "id" | "createdAt">) => Promise<string | null>;
  updateCvTailoringRun: (id: string, updates: Partial<CvTailoringRun>) => Promise<void>;
  removeCompany: (id: string) => Promise<void>;
  removeRole: (id: string) => Promise<void>;
  removeApplication: (id: string) => Promise<void>;
  removeOutreach: (id: string) => Promise<void>;
  removeCvProfile: (id: string) => Promise<void>;
  removeJobDescription: (id: string) => Promise<void>;
  removeCvTailoringRun: (id: string) => Promise<void>;
}

export function useJobOs(userId: string | null): UseJobOsReturn {
  const firebase = getFirebaseContext();
  const [state, setState] = useState<JobOsState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [localOnly, setLocalOnly] = useState(false);
  const [pendingWrites, setPendingWrites] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const effectiveState = userId ? state : EMPTY_STATE;
  const effectiveLoading = userId ? loading : false;
  const effectiveSyncNotice = userId
    ? firebase
      ? syncNotice
      : "Cloud unavailable. Using local Job OS storage."
    : null;

  useEffect(() => {
    if (!userId) {
      return;
    }

    const localState = readLocal(userId);
    const bootstrapTimeoutId = window.setTimeout(() => {
      setState(localState);
      setLoading(false);
    }, 0);

    if (!firebase || localOnly) {
      return () => {
        window.clearTimeout(bootstrapTimeoutId);
      };
    }

    const unsubscribers: Array<() => void> = [];
    let snapshotCount = 0;
    const markLoaded = () => {
      snapshotCount += 1;
      if (snapshotCount >= 8) {
        setLoading(false);
      }
    };
    const subscribeCollection = (
      name:
        | "companies"
        | "roles"
        | "applications"
        | "outreach"
        | "cvProfiles"
        | "jobDescriptions"
        | "cvTailoringRuns",
      mapper: (id: string, data: DocumentData) => unknown
    ) => {
      const ref = collection(firebase.db, "users", userId, name);
      const unsubscribe = onSnapshot(
        ref,
        (snapshot) => {
          setState((prev) => {
            const mappedItems = snapshot.docs.map((d) =>
              mapper(d.id, d.data())
            ) as JobOsState[typeof name];
            const items = name === "companies"
              ? (dedupeCompanies(mappedItems as JobOsCompany[]) as JobOsState[typeof name])
              : mappedItems;
            const latestLocal = readLocal(userId)[name];
            const shouldUseLocal =
              items.length === 0 &&
              latestLocal.length > 0 &&
              snapshot.metadata.fromCache;
            const fallbackItems =
              latestLocal.length > 0 ? latestLocal : prev[name];
            const shouldPreserveDefaults =
              name === "cvProfiles" && items.length === 0 && fallbackItems.length > 0;
            const mergedItems = shouldUseLocal || shouldPreserveDefaults
              ? fallbackItems
              : mergePendingLocalItems(
                  items as Array<{ id: string; clientRequestId?: string }>,
                  latestLocal as Array<{ id: string; clientRequestId?: string }>
                );
            const next = {
              ...prev,
              [name]: mergedItems,
            } as JobOsState;
            writeLocal(userId, next);
            return next;
          });
          setSyncNotice(null);
          setLocalOnly(false);
          setLastSyncedAt(new Date().toISOString());
          markLoaded();
        },
        () => {
          setSyncNotice("Cloud sync unavailable. Working in local mode.");
          setLocalOnly(true);
          markLoaded();
        }
      );
      unsubscribers.push(unsubscribe);
    };

    const assetsRef = doc(firebase.db, "users", userId, "assets", "vault");
    const assetsUnsub = onSnapshot(
      assetsRef,
      (snapshot) => {
        setState((prev) => {
          const remote = snapshot.exists()
            ? normalizeState({
                assets: snapshot.data() as JobOsState["assets"],
                companies: prev.companies,
                roles: prev.roles,
                applications: prev.applications,
                outreach: prev.outreach,
              })
            : prev;
          const next: JobOsState = {
            ...prev,
            assets: remote.assets,
          };
          writeLocal(userId, next);
          return next;
        });
        setSyncNotice(null);
        setLocalOnly(false);
        markLoaded();
      },
      () => {
        setSyncNotice("Cloud sync unavailable. Working in local mode.");
        setLocalOnly(true);
        markLoaded();
      }
    );
    unsubscribers.push(assetsUnsub);

    subscribeCollection("companies", (id, data) =>
      withTimestamps({ ...(data as Record<string, unknown>), id })
    );
    subscribeCollection("roles", (id, data) =>
      withTimestamps({ ...(data as Record<string, unknown>), id })
    );
    subscribeCollection("applications", (id, data) =>
      withTimestamps({ ...(data as Record<string, unknown>), id })
    );
    subscribeCollection("outreach", (id, data) =>
      withTimestamps({ ...(data as Record<string, unknown>), id })
    );
    subscribeCollection("cvProfiles", (id, data) =>
      withTimestamps({ ...(data as Record<string, unknown>), id })
    );
    subscribeCollection("jobDescriptions", (id, data) => ({
      ...(data as Record<string, unknown>),
      id,
      createdAt: asIso((data as { createdAt?: unknown }).createdAt),
    }));
    subscribeCollection("cvTailoringRuns", (id, data) => ({
      ...(data as Record<string, unknown>),
      id,
      createdAt: asIso((data as { createdAt?: unknown }).createdAt),
    }));

    return () => {
      window.clearTimeout(bootstrapTimeoutId);
      unsubscribers.forEach((fn) => fn());
    };
  }, [firebase, localOnly, userId]);

  useEffect(() => {
    if (!userId) {
      resetJobOsSyncSnapshot();
      return;
    }

    updateJobOsSyncSnapshot({
      pendingWrites,
      lastSyncedAt,
      syncNotice: effectiveSyncNotice,
      storageMode: firebase && !localOnly ? "firebase" : "local",
      dataUserId: userId,
      authUid: firebase?.auth.currentUser?.uid ?? null,
      email: firebase?.auth.currentUser?.email ?? null,
    });
  }, [effectiveSyncNotice, firebase, lastSyncedAt, localOnly, pendingWrites, userId]);

  const mutate = useCallback(
    async <T>(
      label: string,
      localMutation: (prev: JobOsState) => JobOsState,
      remoteMutation: (() => Promise<T>) | null
    ): Promise<void> => {
      if (!userId) return;

      // Optimistic local-first persistence so refresh never drops recent changes.
      setState((prev) => {
        const next = localMutation(prev);
        writeLocal(userId, next);
        return next;
      });

      if (!remoteMutation || localOnly) {
        return;
      }
      try {
        setPendingWrites((value) => value + 1);
        await withTimeout(remoteMutation(), label);
        setLastSyncedAt(new Date().toISOString());
      } catch (error) {
        if (!isOfflineLike(error)) {
          throw error;
        }
        // Optimistic update already ran above — do NOT re-run localMutation here
        // or it will prepend/apply the change a second time, creating duplicates.
        setLocalOnly(true);
        setSyncNotice("Cloud sync unavailable. Working in local mode.");
      } finally {
        setPendingWrites((value) => Math.max(0, value - 1));
      }
    },
    [localOnly, userId]
  );

  const updateCv = useCallback(
    async (
      id: string,
      updates: Partial<Pick<JobOsCvAsset, "version" | "fileUrl" | "sourceText" | "sourceTextUpdatedAt" | "linkedProfileId">>
    ) => {
      const now = new Date().toISOString();
      await mutate(
        "Update CV",
        (prev) => {
          const next: JobOsState = {
            ...prev,
            assets: {
              ...prev.assets,
              cvs: prev.assets.cvs.map((cv) =>
                cv.id === id ? { ...cv, ...updates, updatedAt: now } : cv
              ),
            },
          };
          return next;
        },
        firebase && userId && !localOnly
          ? async () => {
              const assetDoc = doc(firebase.db, "users", userId, "assets", "vault");
              const nextCvs = state.assets.cvs.map((cv) =>
                cv.id === id ? { ...cv, ...updates, updatedAt: now } : cv
              );
              await setDoc(
                assetDoc,
                {
                  cvs: nextCvs,
                  scripts: state.assets.scripts,
                  templates: state.assets.templates,
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              );
            }
          : null
      );
    },
    [firebase, localOnly, mutate, state.assets, userId]
  );

  const addScript = useCallback(
    async (
      payload: Omit<
        JobOsScriptAsset,
        "id" | "createdAt" | "updatedAt" | "lastUpdated"
      >
    ) => {
      const now = new Date().toISOString();
      const localItem: JobOsScriptAsset = {
        id: randomId("script"),
        ...payload,
        lastUpdated: now,
        createdAt: now,
        updatedAt: now,
      };
      await mutate(
        "Add script",
        (prev) => ({
          ...prev,
          assets: {
            ...prev.assets,
            scripts: [localItem, ...prev.assets.scripts],
          },
        }),
        firebase && userId && !localOnly
          ? async () => {
              const assetDoc = doc(firebase.db, "users", userId, "assets", "vault");
              await setDoc(
                assetDoc,
                {
                  cvs: state.assets.cvs,
                  scripts: [localItem, ...state.assets.scripts],
                  templates: state.assets.templates,
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              );
            }
          : null
      );
    },
    [firebase, localOnly, mutate, state.assets, userId]
  );

  const addTemplate = useCallback(
    async (
      payload: Omit<JobOsTemplateAsset, "id" | "createdAt" | "updatedAt">
    ) => {
      const now = new Date().toISOString();
      const localItem: JobOsTemplateAsset = {
        id: randomId("template"),
        ...payload,
        createdAt: now,
        updatedAt: now,
      };
      await mutate(
        "Add template",
        (prev) => ({
          ...prev,
          assets: {
            ...prev.assets,
            templates: [localItem, ...prev.assets.templates],
          },
        }),
        firebase && userId && !localOnly
          ? async () => {
              const assetDoc = doc(firebase.db, "users", userId, "assets", "vault");
              await setDoc(
                assetDoc,
                {
                  cvs: state.assets.cvs,
                  scripts: state.assets.scripts,
                  templates: [localItem, ...state.assets.templates],
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              );
            }
          : null
      );
    },
    [firebase, localOnly, mutate, state.assets, userId]
  );

  const addCollectionItem = useCallback(
    async <T extends { id: string; createdAt: string }>(
      key:
        | "companies"
        | "roles"
        | "applications"
        | "outreach"
        | "cvProfiles"
        | "jobDescriptions"
        | "cvTailoringRuns",
      prefix: string,
      payload: Omit<T, "id" | "createdAt">,
      options?: { hasUpdatedAt?: boolean }
    ): Promise<string | null> => {
      const now = new Date().toISOString();
      const clientRequestId = requestId();
      const localPayload = options?.hasUpdatedAt
        ? ({ ...payload, updatedAt: now } as Omit<T, "id" | "createdAt">)
        : payload;
      const remotePayload = options?.hasUpdatedAt
        ? { ...payload, updatedAt: serverTimestamp() }
        : payload;

      if (!firebase) {
        const localItem = {
          id: randomId(prefix),
          ...localPayload,
          createdAt: now,
        } as T;
        await mutate(
          `Add ${key}`,
          (prev) => ({
            ...prev,
            [key]: [localItem, ...(prev[key] as T[])],
          } as JobOsState),
          null
        );
        return localItem.id;
      }

      if (localOnly) {
        const localItem = {
          id: pendingLocalId(prefix, clientRequestId),
          ...localPayload,
          clientRequestId,
          createdAt: now,
        } as T;
        await mutate(
          `Add ${key}`,
          (prev) => ({
            ...prev,
            [key]: [localItem, ...(prev[key] as T[])],
          } as JobOsState),
          null
        );
        return localItem.id;
      }

      try {
        setPendingWrites((value) => value + 1);
        const docRef = await withTimeout(
          addDoc(collection(firebase.db, "users", userId!, key), {
              ...remotePayload,
              clientRequestId,
              createdAt: serverTimestamp(),
            }),
            `Add ${key}`
          );
        setLastSyncedAt(new Date().toISOString());
        return docRef.id;
      } catch (error) {
        if (!isOfflineLike(error)) {
          throw error;
        }
          const localItem = {
            id: pendingLocalId(prefix, clientRequestId),
            ...localPayload,
            clientRequestId,
            createdAt: now,
          } as T;
        setState((prev) => {
          const next = {
            ...prev,
            [key]: [localItem, ...(prev[key] as T[])],
          } as JobOsState;
          writeLocal(userId!, next);
          return next;
        });
        setLocalOnly(true);
        setSyncNotice("Cloud sync unavailable. Working in local mode.");
        return localItem.id;
      } finally {
        setPendingWrites((value) => Math.max(0, value - 1));
      }
    },
    [firebase, localOnly, mutate, userId]
  );

  const updateCollectionItem = useCallback(
    async <T extends { id: string }>(
      key:
        | "companies"
        | "roles"
        | "applications"
        | "outreach"
        | "cvProfiles"
        | "jobDescriptions"
        | "cvTailoringRuns",
      id: string,
      updates: Partial<T>,
      options?: { hasUpdatedAt?: boolean }
    ) => {
      const now = new Date().toISOString();
      const localUpdates = options?.hasUpdatedAt
        ? ({ ...updates, updatedAt: now } as Partial<T>)
        : updates;
      const remoteUpdates = options?.hasUpdatedAt
        ? { ...updates, updatedAt: serverTimestamp() }
        : updates;
      await mutate(
        `Update ${key}`,
        (prev) =>
          collectionDoc<T>(prev, key, id, (existing) => ({
            ...existing,
            ...localUpdates,
          })),
        firebase && userId && !localOnly
          ? async () => {
              const ref = doc(
                firebase.db,
                "users",
                  userId,
                  key,
                  id
                );
                await setDoc(ref, remoteUpdates, { merge: true });
              }
            : null
      );
    },
    [firebase, localOnly, mutate, userId]
  );

  const removeCollectionItem = useCallback(
    async (
      key:
        | "companies"
        | "roles"
        | "applications"
        | "outreach"
        | "cvProfiles"
        | "jobDescriptions"
        | "cvTailoringRuns",
      id: string
    ) => {
      await mutate(
        `Delete ${key}`,
        (prev) => ({
          ...prev,
          [key]: (prev[key] as Array<{ id: string }>).filter((v) => v.id !== id),
        } as JobOsState),
        firebase && userId && !localOnly
          ? async () => {
              const ref = doc(
                firebase.db,
                "users",
                userId,
                key,
                id
              );
              await deleteDoc(ref);
            }
          : null
      );
    },
    [firebase, localOnly, mutate, userId]
  );

  const actions = useMemo(
      () => ({
        updateCv,
        addScript,
        addTemplate,
        addCompany: (payload: Omit<JobOsCompany, "id" | "createdAt" | "updatedAt">) =>
          addCollectionItem<JobOsCompany>("companies", "company", payload, { hasUpdatedAt: true }),
        updateCompany: (id: string, updates: Partial<JobOsCompany>) =>
          updateCollectionItem<JobOsCompany>("companies", id, updates, { hasUpdatedAt: true }),
        addRole: (payload: Omit<JobOsRole, "id" | "createdAt" | "updatedAt">) =>
          addCollectionItem<JobOsRole>("roles", "role", payload, { hasUpdatedAt: true }),
        updateRole: (id: string, updates: Partial<JobOsRole>) =>
          updateCollectionItem<JobOsRole>("roles", id, updates, { hasUpdatedAt: true }),
        addApplication: (
          payload: Omit<JobOsApplication, "id" | "createdAt" | "updatedAt">
        ) => addCollectionItem<JobOsApplication>("applications", "app", payload, { hasUpdatedAt: true }),
        updateApplication: (id: string, updates: Partial<JobOsApplication>) =>
          updateCollectionItem<JobOsApplication>("applications", id, updates, { hasUpdatedAt: true }),
        addOutreach: (payload: Omit<JobOsOutreach, "id" | "createdAt" | "updatedAt">) =>
          addCollectionItem<JobOsOutreach>("outreach", "outreach", payload, { hasUpdatedAt: true }),
        updateOutreach: (id: string, updates: Partial<JobOsOutreach>) =>
          updateCollectionItem<JobOsOutreach>("outreach", id, updates, { hasUpdatedAt: true }),
        addCvProfile: (payload: Omit<CvProfile, "id" | "createdAt" | "updatedAt">) =>
          addCollectionItem<CvProfile>("cvProfiles", "cv-profile", payload, { hasUpdatedAt: true }),
        updateCvProfile: (id: string, updates: Partial<CvProfile>) =>
          updateCollectionItem<CvProfile>("cvProfiles", id, updates, { hasUpdatedAt: true }),
        addJobDescription: (payload: Omit<JobDescription, "id" | "createdAt">) =>
          addCollectionItem<JobDescription>("jobDescriptions", "job-description", payload),
        updateJobDescription: (id: string, updates: Partial<JobDescription>) =>
          updateCollectionItem<JobDescription>("jobDescriptions", id, updates),
        addCvTailoringRun: (payload: Omit<CvTailoringRun, "id" | "createdAt">) =>
          addCollectionItem<CvTailoringRun>("cvTailoringRuns", "cv-run", payload),
        updateCvTailoringRun: (id: string, updates: Partial<CvTailoringRun>) =>
          updateCollectionItem<CvTailoringRun>("cvTailoringRuns", id, updates),
        removeCompany: (id: string) => removeCollectionItem("companies", id),
        removeRole: (id: string) => removeCollectionItem("roles", id),
        removeApplication: (id: string) => removeCollectionItem("applications", id),
        removeOutreach: (id: string) => removeCollectionItem("outreach", id),
        removeCvProfile: (id: string) => removeCollectionItem("cvProfiles", id),
        removeJobDescription: (id: string) => removeCollectionItem("jobDescriptions", id),
        removeCvTailoringRun: (id: string) => removeCollectionItem("cvTailoringRuns", id),
      }),
    [
      addCollectionItem,
      addScript,
      addTemplate,
      removeCollectionItem,
      updateCollectionItem,
      updateCv,
    ]
  );

  return {
    ...effectiveState,
    loading: effectiveLoading,
    syncNotice: effectiveSyncNotice,
    pendingWrites,
    lastSyncedAt,
    storageMode: firebase && !localOnly ? "firebase" : "local",
    ...actions,
  };
}








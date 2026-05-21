import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseContext } from "../services/firebase";
import {
  resetJobOsSyncSnapshot,
  updateJobOsSyncSnapshot,
} from "../services/jobOsSync";
import type {
  ApplicationStatus,
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
  JobSource,
  RoleStatus,
  SavedSearch,
} from "../types/jobOs";
import {
  EMPTY_JOB_OS_STATE,
  JOB_OS_COLLECTION_KEYS,
  type JobOsCollectionKey,
  normalizeJobOsState,
} from "../services/jobOsState";
import {
  getApplicationCvAssetId,
  MAX_CV_ASSETS,
  normalizeCvDefaults,
} from "../services/cvAssets";
import { normalizeApplicationNextActionForStatus } from "../services/jobOsApplications";
import { isArchived } from "../services/jobOsArchive";

const LOCAL_KEY_PREFIX = "job_os_v1";
const MUTATION_TIMEOUT_MS = 12000;
type SyncedCollectionKey = JobOsCollectionKey;

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

function readLocal(userId: string): JobOsState {
  try {
    const raw = localStorage.getItem(localKey(userId));
    if (!raw) return normalizeJobOsState(EMPTY_JOB_OS_STATE);
    return normalizeJobOsState(JSON.parse(raw));
  } catch {
    return normalizeJobOsState(EMPTY_JOB_OS_STATE);
  }
}

function writeLocal(userId: string, state: JobOsState): void {
  localStorage.setItem(localKey(userId), JSON.stringify(state));
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

function stripUndefinedFields<T extends Record<string, unknown>>(value: T): T {
  return stripUndefinedValue(value) as T;
}

function stripUndefinedValue(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefinedValue(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .map(([key, entryValue]) => [key, stripUndefinedValue(entryValue)] as const)
        .filter(([, entryValue]) => entryValue !== undefined)
    );
  }

  return value;
}

function syncApplicationCvLabels(
  applications: JobOsApplication[],
  previousCvs: JobOsCvAsset[],
  nextCvs: JobOsCvAsset[],
  updatedCvId: string
): JobOsApplication[] {
  const nextCv = nextCvs.find((cv) => cv.id === updatedCvId);
  if (!nextCv) return applications;

  const previousCv = previousCvs.find((cv) => cv.id === updatedCvId);
  const previousName = previousCv?.name ?? "";

  return applications.map((application) => {
    const resolvedCvAssetId = getApplicationCvAssetId(application, previousCvs);
    if (resolvedCvAssetId !== updatedCvId) {
      return application;
    }

    return {
      ...application,
      cvAssetId: updatedCvId,
      cvVersion:
        application.cvVersion === previousName || !application.cvVersion.trim()
          ? nextCv.name
          : application.cvVersion,
      updatedAt: new Date().toISOString(),
    };
  });
}

function mapRoleStatusToApplicationStatus(
  status: RoleStatus
): ApplicationStatus | null {
  switch (status) {
    case "applied":
      return "sent";
    case "interview":
      return "interview";
    case "rejected":
      return "rejected";
    case "offer":
      return "offer";
    case "to_apply":
    case "closed":
    default:
      return null;
  }
}

function mapApplicationStatusToRoleStatus(
  status: ApplicationStatus
): RoleStatus | null {
  switch (status) {
    case "sent":
    case "screen":
    case "case":
      return "applied";
    case "interview":
    case "final":
      return "interview";
    case "offer":
      return "offer";
    case "rejected":
      return "rejected";
    case "ghosted":
      return "closed";
    default:
      return null;
  }
}

function hasOpenApplicationForRole(
  applications: JobOsApplication[],
  roleId: string
): boolean {
  return applications.some(
    (application) => application.roleId === roleId && !isArchived(application)
  );
}

function isInterviewStageStatus(status: ApplicationStatus): boolean {
  return status === "interview" || status === "final" || status === "offer";
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
  const code =
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
      ? ((error as { code: string }).code || "").toLowerCase()
      : "";
  return (
    code.includes("permission-denied") ||
    code.includes("unauthenticated") ||
    message.includes("timed out") ||
    message.includes("offline") ||
    message.includes("network") ||
    message.includes("unavailable") ||
    message.includes("insufficient permissions") ||
    message.includes("missing or insufficient permissions")
  );
}

function collectionDoc<T extends { id: string }>(
  state: JobOsState,
  key: SyncedCollectionKey,
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

export interface UseJobOsReturn extends JobOsState {
  loading: boolean;
  syncNotice: string | null;
  pendingWrites: number;
  lastSyncedAt: string | null;
  storageMode: "firebase" | "local";
  updateCv: (
    id: string,
    updates: Partial<Pick<JobOsCvAsset, "name" | "version" | "fileUrl" | "sourceText" | "sourceTextUpdatedAt" | "linkedProfileId" | "isDefault">>
  ) => Promise<void>;
  addCv: (payload: Omit<JobOsCvAsset, "id" | "createdAt" | "updatedAt">) => Promise<string | null>;
  removeCv: (id: string) => Promise<void>;
  addScript: (payload: Omit<JobOsScriptAsset, "id" | "createdAt" | "updatedAt" | "lastUpdated">) => Promise<void>;
  updateScript: (id: string, updates: Partial<JobOsScriptAsset>) => Promise<void>;
  removeScript: (id: string) => Promise<void>;
  addTemplate: (payload: Omit<JobOsTemplateAsset, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<JobOsTemplateAsset>) => Promise<void>;
  removeTemplate: (id: string) => Promise<void>;
  addSource: (payload: Omit<JobSource, "id" | "createdAt" | "updatedAt">) => Promise<string | null>;
  updateSource: (id: string, updates: Partial<JobSource>) => Promise<void>;
  removeSource: (id: string) => Promise<void>;
  addSavedSearch: (payload: Omit<SavedSearch, "id" | "createdAt" | "updatedAt">) => Promise<string | null>;
  updateSavedSearch: (id: string, updates: Partial<SavedSearch>) => Promise<void>;
  removeSavedSearch: (id: string) => Promise<void>;
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
  importAll: (data: {
    companies: JobOsCompany[];
    roles: JobOsRole[];
    applications: JobOsApplication[];
    outreach: JobOsOutreach[];
  }) => Promise<void>;
  exportState: () => JobOsState;
  replaceState: (nextState: JobOsState) => Promise<void>;
}

export function useJobOs(userId: string | null): UseJobOsReturn {
  const firebase = getFirebaseContext();
  const [state, setState] = useState<JobOsState>(EMPTY_JOB_OS_STATE);
  const [loading, setLoading] = useState(true);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [localOnly, setLocalOnly] = useState(false);
  const [pendingWrites, setPendingWrites] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const effectiveState = userId ? state : EMPTY_JOB_OS_STATE;
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
    const SUBSCRIPTION_KEYS = [
      "assets",
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
    const loadedKeys = new Set<string>();
    const markLoaded = (key: string) => {
      loadedKeys.add(key);
      if (loadedKeys.size >= SUBSCRIPTION_KEYS.length) {
        setLoading(false);
      }
    };
    const subscribeCollection = (
      name: SyncedCollectionKey,
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
            const next = normalizeJobOsState({
              ...prev,
              [name]: mergedItems,
            });
            writeLocal(userId, next);
            return next;
          });
          setSyncNotice(null);
          setLocalOnly(false);
          setLastSyncedAt(new Date().toISOString());
          markLoaded(name);
        },
        () => {
          setSyncNotice("Cloud sync unavailable. Working in local mode.");
          setLocalOnly(true);
          markLoaded(name);
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
            ? normalizeJobOsState({
                assets: snapshot.data() as JobOsState["assets"],
                sources: prev.sources,
                savedSearches: prev.savedSearches,
                companies: prev.companies,
                roles: prev.roles,
                applications: prev.applications,
                outreach: prev.outreach,
                cvProfiles: prev.cvProfiles,
                jobDescriptions: prev.jobDescriptions,
                cvTailoringRuns: prev.cvTailoringRuns,
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
        markLoaded("assets");
      },
      () => {
        setSyncNotice("Cloud sync unavailable. Working in local mode.");
        setLocalOnly(true);
        markLoaded("assets");
      }
    );
    unsubscribers.push(assetsUnsub);

    subscribeCollection("sources", (id, data) =>
      withTimestamps({ ...(data as Record<string, unknown>), id })
    );
    subscribeCollection("savedSearches", (id, data) =>
      withTimestamps({ ...(data as Record<string, unknown>), id })
    );
    subscribeCollection("companies", (id, data) =>
      withTimestamps({ ...(data as Record<string, unknown>), id })
    );
    subscribeCollection("roles", (id, data) =>
      withTimestamps({ ...(data as Record<string, unknown>), id })
    );
    subscribeCollection("applications", (id, data) => {
      const localAssets = readLocal(userId).assets.cvs;
      const normalized = withTimestamps({ ...(data as Record<string, unknown>), id }) as JobOsApplication;
      const resolvedCvAssetId = getApplicationCvAssetId(normalized, localAssets);
      const matchedCv = resolvedCvAssetId
        ? localAssets.find((cv) => cv.id === resolvedCvAssetId)
        : undefined;

      return {
        ...normalized,
        cvAssetId: resolvedCvAssetId,
        cvVersion: matchedCv?.name ?? normalized.cvVersion,
      };
    });
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
      updates: Partial<Pick<JobOsCvAsset, "name" | "version" | "fileUrl" | "sourceText" | "sourceTextUpdatedAt" | "linkedProfileId" | "isDefault">>
    ) => {
      const now = new Date().toISOString();
      await mutate(
        "Update CV",
        (prev) => {
          const nextCvs = normalizeCvDefaults(
            prev.assets.cvs.map((cv) =>
              cv.id === id ? { ...cv, ...updates, updatedAt: now } : cv
            )
          );
          const next: JobOsState = {
            ...prev,
            assets: {
              ...prev.assets,
              cvs: nextCvs,
            },
            applications: syncApplicationCvLabels(
              prev.applications,
              prev.assets.cvs,
              nextCvs,
              id
            ),
          };
          return next;
        },
        firebase && userId && !localOnly
          ? async () => {
            const assetDoc = doc(firebase.db, "users", userId, "assets", "vault");
              const nextCvs = normalizeCvDefaults(
                state.assets.cvs.map((cv) =>
                  cv.id === id ? { ...cv, ...updates, updatedAt: now } : cv
                )
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

  const addCv = useCallback(
    async (payload: Omit<JobOsCvAsset, "id" | "createdAt" | "updatedAt">) => {
      if (state.assets.cvs.length >= MAX_CV_ASSETS) {
        throw new Error(`You can store up to ${MAX_CV_ASSETS} CV versions.`);
      }

      const now = new Date().toISOString();
      const localItem: JobOsCvAsset = {
        id: randomId("cv"),
        ...payload,
        locked: false,
        createdAt: now,
        updatedAt: now,
      };

      await mutate(
        "Add CV",
        (prev) => ({
          ...prev,
          assets: {
            ...prev.assets,
            cvs: normalizeCvDefaults([localItem, ...prev.assets.cvs]),
          },
        }),
        firebase && userId && !localOnly
          ? async () => {
              const assetDoc = doc(firebase.db, "users", userId, "assets", "vault");
              await setDoc(
                assetDoc,
                {
                  cvs: normalizeCvDefaults([localItem, ...state.assets.cvs]),
                  scripts: state.assets.scripts,
                  templates: state.assets.templates,
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              );
            }
          : null
      );

      return localItem.id;
    },
    [firebase, localOnly, mutate, state.assets, userId]
  );

  const removeCv = useCallback(
    async (id: string) => {
      await mutate(
        "Remove CV",
        (prev) => ({
          ...prev,
          assets: {
            ...prev.assets,
            cvs: normalizeCvDefaults(prev.assets.cvs.filter((cv) => cv.id !== id)),
          },
        }),
        firebase && userId && !localOnly
          ? async () => {
              const assetDoc = doc(firebase.db, "users", userId, "assets", "vault");
              await setDoc(
                assetDoc,
                {
                  cvs: normalizeCvDefaults(state.assets.cvs.filter((cv) => cv.id !== id)),
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

  const updateScript = useCallback(
    async (id: string, updates: Partial<JobOsScriptAsset>) => {
      const now = new Date().toISOString();
      await mutate(
        "Update script",
        (prev) => ({
          ...prev,
          assets: {
            ...prev.assets,
            scripts: prev.assets.scripts.map((script) =>
              script.id === id
                ? { ...script, ...updates, lastUpdated: now, updatedAt: now }
                : script
            ),
          },
        }),
        firebase && userId && !localOnly
          ? async () => {
              const assetDoc = doc(firebase.db, "users", userId, "assets", "vault");
              await setDoc(
                assetDoc,
                {
                  cvs: state.assets.cvs,
                  scripts: state.assets.scripts.map((script) =>
                    script.id === id
                      ? { ...script, ...updates, lastUpdated: now, updatedAt: now }
                      : script
                  ),
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

  const removeScript = useCallback(
    async (id: string) => {
      await mutate(
        "Remove script",
        (prev) => ({
          ...prev,
          assets: {
            ...prev.assets,
            scripts: prev.assets.scripts.filter((script) => script.id !== id),
          },
        }),
        firebase && userId && !localOnly
          ? async () => {
              const assetDoc = doc(firebase.db, "users", userId, "assets", "vault");
              await setDoc(
                assetDoc,
                {
                  cvs: state.assets.cvs,
                  scripts: state.assets.scripts.filter((script) => script.id !== id),
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

  const updateTemplate = useCallback(
    async (id: string, updates: Partial<JobOsTemplateAsset>) => {
      const now = new Date().toISOString();
      await mutate(
        "Update template",
        (prev) => ({
          ...prev,
          assets: {
            ...prev.assets,
            templates: prev.assets.templates.map((template) =>
              template.id === id ? { ...template, ...updates, updatedAt: now } : template
            ),
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
                  templates: state.assets.templates.map((template) =>
                    template.id === id ? { ...template, ...updates, updatedAt: now } : template
                  ),
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

  const removeTemplate = useCallback(
    async (id: string) => {
      await mutate(
        "Remove template",
        (prev) => ({
          ...prev,
          assets: {
            ...prev.assets,
            templates: prev.assets.templates.filter((template) => template.id !== id),
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
                  templates: state.assets.templates.filter((template) => template.id !== id),
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
      key: SyncedCollectionKey,
      prefix: string,
      payload: Omit<T, "id" | "createdAt">,
      options?: { hasUpdatedAt?: boolean }
    ): Promise<string | null> => {
      const now = new Date().toISOString();
      const clientRequestId = requestId();
      const localPayload = options?.hasUpdatedAt
        ? ({ ...payload, updatedAt: now } as Omit<T, "id" | "createdAt">)
        : payload;
      const remotePayload = stripUndefinedFields(
        options?.hasUpdatedAt
          ? ({ ...payload, updatedAt: serverTimestamp() } as Record<string, unknown>)
          : (payload as Record<string, unknown>)
      );

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
      key: SyncedCollectionKey,
      id: string,
      updates: Partial<T>,
      options?: { hasUpdatedAt?: boolean }
    ) => {
      const now = new Date().toISOString();
      const localUpdates = options?.hasUpdatedAt
        ? ({ ...updates, updatedAt: now } as Partial<T>)
        : updates;
      const remoteUpdates = stripUndefinedFields(
        options?.hasUpdatedAt
          ? ({ ...updates, updatedAt: serverTimestamp() } as Record<string, unknown>)
          : (updates as Record<string, unknown>)
      );
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
      key: SyncedCollectionKey,
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

  const importAll = useCallback(
    async (data: {
      companies: JobOsCompany[];
      roles: JobOsRole[];
      applications: JobOsApplication[];
      outreach: JobOsOutreach[];
    }): Promise<void> => {
      if (!userId) return;
      const now = new Date().toISOString();
      const COLLECTIONS = ["companies", "roles", "applications", "outreach"] as const;

      // Optimistic local update
      setState((prev) => {
        const next: JobOsState = {
          ...prev,
          companies: data.companies,
          roles: data.roles,
          applications: data.applications,
          outreach: data.outreach,
        };
        writeLocal(userId, next);
        return next;
      });

      if (!firebase || localOnly) return;

      // Upsert each item into Firestore
      for (const col of COLLECTIONS) {
        for (const item of data[col]) {
          const { id, ...rest } = item as { id: string } & Record<string, unknown>;
          const ref = doc(firebase.db, "users", userId, col, id);
          await setDoc(ref, { ...rest, updatedAt: now }, { merge: true });
        }
      }
      setLastSyncedAt(new Date().toISOString());
    },
    [firebase, localOnly, userId]
  );
  const replaceState = useCallback(
    async (nextState: JobOsState) => {
      if (!userId) return;

      const normalizedState = normalizeJobOsState(nextState);

      await mutate(
        "Import Job OS state",
        () => normalizedState,
        firebase && !localOnly
          ? async () => {
              const batch = writeBatch(firebase.db);
              const assetsDoc = doc(firebase.db, "users", userId, "assets", "vault");

              batch.set(
                assetsDoc,
                {
                  ...normalizedState.assets,
                  updatedAt: serverTimestamp(),
                },
                { merge: false }
              );

              for (const key of JOB_OS_COLLECTION_KEYS) {
                const collectionRef = collection(firebase.db, "users", userId, key);
                const snapshot = await getDocs(collectionRef);

                snapshot.docs.forEach((item) => {
                  batch.delete(item.ref);
                });

                (normalizedState[key] as Array<Record<string, unknown> & { id: string }>).forEach((item) => {
                  const itemRef = doc(firebase.db, "users", userId, key, item.id);
                  batch.set(itemRef, stripUndefinedFields(item));
                });
              }

              await batch.commit();
            }
          : null
      );
    },
    [firebase, localOnly, mutate, userId]
  );

  const actions = useMemo(
      () => ({
        updateCv,
        addCv,
        removeCv,
        addScript,
        updateScript,
        removeScript,
        addTemplate,
        updateTemplate,
        removeTemplate,
        addSource: (payload: Omit<JobSource, "id" | "createdAt" | "updatedAt">) =>
          addCollectionItem<JobSource>("sources", "source", payload, { hasUpdatedAt: true }),
        updateSource: (id: string, updates: Partial<JobSource>) =>
          updateCollectionItem<JobSource>("sources", id, updates, { hasUpdatedAt: true }),
        removeSource: (id: string) => removeCollectionItem("sources", id),
        addSavedSearch: (payload: Omit<SavedSearch, "id" | "createdAt" | "updatedAt">) =>
          addCollectionItem<SavedSearch>("savedSearches", "saved-search", payload, {
            hasUpdatedAt: true,
          }),
        updateSavedSearch: (id: string, updates: Partial<SavedSearch>) =>
          updateCollectionItem<SavedSearch>("savedSearches", id, updates, {
            hasUpdatedAt: true,
          }),
        removeSavedSearch: (id: string) => removeCollectionItem("savedSearches", id),
        addCompany: (payload: Omit<JobOsCompany, "id" | "createdAt" | "updatedAt">) =>
          addCollectionItem<JobOsCompany>("companies", "company", payload, { hasUpdatedAt: true }),
        updateCompany: (id: string, updates: Partial<JobOsCompany>) =>
          updateCollectionItem<JobOsCompany>("companies", id, updates, { hasUpdatedAt: true }),
        addRole: (payload: Omit<JobOsRole, "id" | "createdAt" | "updatedAt">) =>
          addCollectionItem<JobOsRole>("roles", "role", payload, { hasUpdatedAt: true }),
        updateRole: async (id: string, updates: Partial<JobOsRole>) => {
          const now = new Date().toISOString();
          const syncedApplicationStatus =
            updates.status ? mapRoleStatusToApplicationStatus(updates.status) : null;
          const linkedApplications = state.applications.filter(
            (application) => application.roleId === id && !isArchived(application)
          );

          await mutate(
            "Update roles",
            (prev) => ({
              ...prev,
              roles: prev.roles.map((role) =>
                role.id === id ? { ...role, ...updates, updatedAt: now } : role
              ),
              applications:
                syncedApplicationStatus == null
                  ? prev.applications
                  : prev.applications.map((application) =>
                      application.roleId === id
                        ? {
                            ...application,
                            status: syncedApplicationStatus,
                            nextAction: normalizeApplicationNextActionForStatus(
                              application.nextAction,
                              syncedApplicationStatus
                            ),
                            interviewStageReached:
                              application.interviewStageReached ||
                              isInterviewStageStatus(syncedApplicationStatus),
                            updatedAt: now,
                          }
                        : application
                    ),
            }),
            firebase && userId && !localOnly
              ? async () => {
                  const roleRef = doc(firebase.db, "users", userId, "roles", id);
                  await setDoc(
                    roleRef,
                    stripUndefinedFields({
                      ...updates,
                      updatedAt: serverTimestamp(),
                    }),
                    { merge: true }
                  );

                  if (syncedApplicationStatus == null) {
                    return;
                  }

                  await Promise.all(
                    linkedApplications.map((application) =>
                      setDoc(
                        doc(firebase.db, "users", userId, "applications", application.id),
                        {
                          status: syncedApplicationStatus,
                          nextAction: normalizeApplicationNextActionForStatus(
                            application.nextAction,
                            syncedApplicationStatus
                          ),
                          ...(application.interviewStageReached ||
                          isInterviewStageStatus(syncedApplicationStatus)
                            ? { interviewStageReached: true }
                            : {}),
                          updatedAt: serverTimestamp(),
                        },
                        { merge: true }
                      )
                    )
                  );
                }
              : null
          );
        },
        addApplication: async (
          payload: Omit<JobOsApplication, "id" | "createdAt" | "updatedAt">
        ) => {
          const roleId = payload.roleId?.trim();
          if (
            roleId &&
            hasOpenApplicationForRole(state.applications, roleId)
          ) {
            throw new Error("An application for this role already exists.");
          }

          const normalizedPayload: Omit<JobOsApplication, "id" | "createdAt" | "updatedAt"> = {
            ...payload,
            nextAction: normalizeApplicationNextActionForStatus(
              payload.nextAction,
              payload.status
            ),
          };
          const appId = await addCollectionItem<JobOsApplication>(
            "applications",
            "app",
            normalizedPayload,
            { hasUpdatedAt: true }
          );

          // Propagate: mark the linked role as having an application and sync its status.
          if (roleId) {
            const syncedRoleStatus = mapApplicationStatusToRoleStatus(normalizedPayload.status);
            const roleUpdates: Partial<JobOsRole> = {
              hasApplication: true,
              ...(syncedRoleStatus != null ? { status: syncedRoleStatus } : {}),
            };
            await mutate(
              "Sync role on addApplication",
              (prev) => ({
                ...prev,
                roles: prev.roles.map((r) =>
                  r.id === roleId ? { ...r, ...roleUpdates, updatedAt: new Date().toISOString() } : r
                ),
              }),
              firebase && userId && !localOnly
                ? async () => {
                    await setDoc(
                      doc(firebase.db, "users", userId, "roles", roleId),
                      { ...roleUpdates, updatedAt: serverTimestamp() },
                      { merge: true }
                    );
                  }
                : null
            );
          }

          return appId;
        },
        updateApplication: async (id: string, updates: Partial<JobOsApplication>) => {
          const now = new Date().toISOString();
          const targetApplication = state.applications.find((application) => application.id === id);
          const linkedRoleId = targetApplication?.roleId ?? updates.roleId;
          const syncedRoleStatus =
            updates.status ? mapApplicationStatusToRoleStatus(updates.status) : null;
          const archiveSyncedRoleStatus =
            updates.archived === true
              ? "closed"
              : updates.archived === false && targetApplication
                ? mapApplicationStatusToRoleStatus(updates.status ?? targetApplication.status)
                : null;
          const nextRoleStatus = archiveSyncedRoleStatus ?? syncedRoleStatus;
          const hasExplicitInterviewMarker = typeof updates.interviewStageReached === "boolean";
          const shouldMarkInterviewReached =
            !hasExplicitInterviewMarker &&
            (Boolean(targetApplication?.interviewStageReached) ||
              Boolean(updates.status && isInterviewStageStatus(updates.status)));
          const normalizedUpdates: Partial<JobOsApplication> = {
            ...updates,
            ...(shouldMarkInterviewReached ? { interviewStageReached: true } : {}),
          };
          const nextStatus = updates.status ?? targetApplication?.status;
          const nextAction = updates.nextAction ?? targetApplication?.nextAction;

          if (nextStatus && typeof nextAction === "string") {
            const normalizedNextAction = normalizeApplicationNextActionForStatus(
              nextAction,
              nextStatus
            );

            if (
              updates.nextAction !== undefined ||
              normalizedNextAction !== targetApplication?.nextAction
            ) {
              normalizedUpdates.nextAction = normalizedNextAction;
            }
          }

          await mutate(
            "Update applications",
            (prev) => ({
              ...prev,
              applications: prev.applications.map((application) =>
                application.id === id ? { ...application, ...normalizedUpdates, updatedAt: now } : application
              ),
              roles:
                !linkedRoleId || nextRoleStatus == null
                  ? prev.roles
                  : prev.roles.map((role) =>
                      role.id === linkedRoleId
                        ? {
                            ...role,
                            status: nextRoleStatus,
                            hasApplication: updates.archived === true ? false : true,
                            updatedAt: now,
                          }
                        : role
                    ),
            }),
            firebase && userId && !localOnly
              ? async () => {
                  const applicationRef = doc(firebase.db, "users", userId, "applications", id);
                  await setDoc(
                    applicationRef,
                    stripUndefinedFields({
                      ...updates,
                      ...normalizedUpdates,
                      updatedAt: serverTimestamp(),
                    }),
                    { merge: true }
                  );

                  if (!linkedRoleId || nextRoleStatus == null) {
                    return;
                  }

                  await setDoc(
                    doc(firebase.db, "users", userId, "roles", linkedRoleId),
                    {
                      status: nextRoleStatus,
                      hasApplication: updates.archived === true ? false : true,
                      updatedAt: serverTimestamp(),
                    },
                    { merge: true }
                  );
                }
              : null
          );
        },
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
        removeApplication: async (id: string) => {
          // Find the linked role before removing so we can reset its state.
          const application = state.applications.find((a) => a.id === id);
          const roleId = application?.roleId;
          await removeCollectionItem("applications", id);
          // Propagate: unmark the linked role's hasApplication and reset status to to_apply.
          if (roleId) {
            const roleUpdates: Partial<JobOsRole> = { hasApplication: false, status: "to_apply" };
            await mutate(
              "Sync role on removeApplication",
              (prev) => ({
                ...prev,
                roles: prev.roles.map((r) =>
                  r.id === roleId ? { ...r, ...roleUpdates, updatedAt: new Date().toISOString() } : r
                ),
              }),
              firebase && userId && !localOnly
                ? async () => {
                    await setDoc(
                      doc(firebase.db, "users", userId, "roles", roleId),
                      { ...roleUpdates, updatedAt: serverTimestamp() },
                      { merge: true }
                    );
                  }
                : null
            );
          }
        },
        removeOutreach: (id: string) => removeCollectionItem("outreach", id),
        removeCvProfile: (id: string) => removeCollectionItem("cvProfiles", id),
        removeJobDescription: (id: string) => removeCollectionItem("jobDescriptions", id),
        removeCvTailoringRun: (id: string) => removeCollectionItem("cvTailoringRuns", id),
        exportState: () => normalizeJobOsState(state),
        replaceState,
      }),
    [
      addCollectionItem,
      addCv,
      addScript,
      addTemplate,
      firebase,
      localOnly,
      mutate,
      removeCollectionItem,
      removeCv,
      removeScript,
      removeTemplate,
      replaceState,
      state,
      updateCollectionItem,
      updateCv,
      updateScript,
      updateTemplate,
      userId,
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
    importAll,
  };
}








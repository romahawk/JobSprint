import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseContext } from "../services/firebase";
import type {
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
    locked: true,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "cv-product-engineer",
    name: "CV - Product Engineer",
    version: "v1.0",
    fileUrl: "",
    locked: true,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "cv-systems-pm",
    name: "CV - Systems / Platform PM",
    version: "v1.0",
    fileUrl: "",
    locked: true,
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
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function collectionDoc<T extends { id: string }>(
  state: JobOsState,
  key: "companies" | "roles" | "applications" | "outreach",
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
  updateCv: (
    id: string,
    updates: Partial<Pick<JobOsCvAsset, "version" | "fileUrl">>
  ) => Promise<void>;
  addScript: (payload: Omit<JobOsScriptAsset, "id" | "createdAt" | "updatedAt" | "lastUpdated">) => Promise<void>;
  addTemplate: (payload: Omit<JobOsTemplateAsset, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  addCompany: (payload: Omit<JobOsCompany, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateCompany: (id: string, updates: Partial<JobOsCompany>) => Promise<void>;
  addRole: (payload: Omit<JobOsRole, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateRole: (id: string, updates: Partial<JobOsRole>) => Promise<void>;
  addApplication: (payload: Omit<JobOsApplication, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateApplication: (id: string, updates: Partial<JobOsApplication>) => Promise<void>;
  addOutreach: (payload: Omit<JobOsOutreach, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateOutreach: (id: string, updates: Partial<JobOsOutreach>) => Promise<void>;
  removeCompany: (id: string) => Promise<void>;
  removeRole: (id: string) => Promise<void>;
  removeApplication: (id: string) => Promise<void>;
  removeOutreach: (id: string) => Promise<void>;
}

export function useJobOs(userId: string | null): UseJobOsReturn {
  const firebase = getFirebaseContext();
  const [state, setState] = useState<JobOsState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [localOnly, setLocalOnly] = useState(false);
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
      if (snapshotCount >= 5) {
        setLoading(false);
      }
    };
    const subscribeCollection = (
      name: "companies" | "roles" | "applications" | "outreach",
      mapper: (id: string, data: DocumentData) => unknown
    ) => {
      const ref = collection(firebase.db, "users", userId, name);
      const unsubscribe = onSnapshot(
        ref,
        (snapshot) => {
          setState((prev) => {
            const mappedItems = snapshot.docs.map((d) =>
              mapper(d.id, d.data())
            ) as Array<{ id: string }>;

            // Build Firestore-side list (deduped by name for companies)
            const firestoreItems = name === "companies"
              ? dedupeCompanies(mappedItems as JobOsCompany[])
              : mappedItems;

            // Preserve items currently in state that are not yet in Firestore
            // (e.g. optimistic writes still pending, or offline-created items)
            const firestoreIds = new Set(firestoreItems.map((i) => i.id));
            const prevItems = prev[name] as Array<{ id: string }>;
            const localOnlyItems = prevItems.filter((item) => !firestoreIds.has(item.id));

            // Merge Firestore items first, then local-only; dedupe by id to
            // guard against any race where the same item appears in both.
            const raw = dedupeById([...firestoreItems, ...localOnlyItems]);
            const merged = name === "companies"
              ? dedupeCompanies(raw as JobOsCompany[])
              : raw;

            const next = {
              ...prev,
              [name]: merged,
            } as JobOsState;
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

    return () => {
      window.clearTimeout(bootstrapTimeoutId);
      unsubscribers.forEach((fn) => fn());
    };
  }, [firebase, localOnly, userId]);

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
        await withTimeout(remoteMutation(), label);
      } catch (error) {
        if (!isOfflineLike(error)) {
          throw error;
        }
        // Optimistic update already ran above — do NOT re-run localMutation here
        // or it will prepend/apply the change a second time, creating duplicates.
        setLocalOnly(true);
        setSyncNotice("Cloud sync unavailable. Working in local mode.");
      }
    },
    [localOnly, userId]
  );

  const updateCv = useCallback(
    async (
      id: string,
      updates: Partial<Pick<JobOsCvAsset, "version" | "fileUrl">>
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
    async <T extends { id: string; createdAt: string; updatedAt: string }>(
      key: "companies" | "roles" | "applications" | "outreach",
      prefix: string,
      payload: Omit<T, "id" | "createdAt" | "updatedAt">
    ) => {
      const now = new Date().toISOString();
      const localItem = {
        id: randomId(prefix),
        ...payload,
        createdAt: now,
        updatedAt: now,
      } as T;
      await mutate(
        `Add ${key}`,
        (prev) => ({
          ...prev,
          [key]: [localItem, ...(prev[key] as T[])],
        } as JobOsState),
        firebase && userId && !localOnly
          ? async () => {
              const docRef = doc(
                firebase.db,
                "users",
                userId,
                key,
                localItem.id
              );
              await setDoc(docRef, {
                ...payload,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          : null
      );
    },
    [firebase, localOnly, mutate, userId]
  );

  const updateCollectionItem = useCallback(
    async <T extends { id: string }>(
      key: "companies" | "roles" | "applications" | "outreach",
      id: string,
      updates: Partial<T>
    ) => {
      const now = new Date().toISOString();
      await mutate(
        `Update ${key}`,
        (prev) =>
          collectionDoc<T>(prev, key, id, (existing) => ({
            ...existing,
            ...updates,
            updatedAt: now,
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
              await setDoc(ref, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
            }
          : null
      );
    },
    [firebase, localOnly, mutate, userId]
  );

  const removeCollectionItem = useCallback(
    async (key: "companies" | "roles" | "applications" | "outreach", id: string) => {
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
        addCollectionItem<JobOsCompany>("companies", "company", payload),
      updateCompany: (id: string, updates: Partial<JobOsCompany>) =>
        updateCollectionItem<JobOsCompany>("companies", id, updates),
      addRole: (payload: Omit<JobOsRole, "id" | "createdAt" | "updatedAt">) =>
        addCollectionItem<JobOsRole>("roles", "role", payload),
      updateRole: (id: string, updates: Partial<JobOsRole>) =>
        updateCollectionItem<JobOsRole>("roles", id, updates),
      addApplication: (
        payload: Omit<JobOsApplication, "id" | "createdAt" | "updatedAt">
      ) => addCollectionItem<JobOsApplication>("applications", "app", payload),
      updateApplication: (id: string, updates: Partial<JobOsApplication>) =>
        updateCollectionItem<JobOsApplication>("applications", id, updates),
      addOutreach: (payload: Omit<JobOsOutreach, "id" | "createdAt" | "updatedAt">) =>
        addCollectionItem<JobOsOutreach>("outreach", "outreach", payload),
      updateOutreach: (id: string, updates: Partial<JobOsOutreach>) =>
        updateCollectionItem<JobOsOutreach>("outreach", id, updates),
      removeCompany: (id: string) => removeCollectionItem("companies", id),
      removeRole: (id: string) => removeCollectionItem("roles", id),
      removeApplication: (id: string) => removeCollectionItem("applications", id),
      removeOutreach: (id: string) => removeCollectionItem("outreach", id),
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
    ...actions,
  };
}

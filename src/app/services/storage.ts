import type { AppData, WeeklyGoals } from "../types";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseContext } from "./firebase";

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export interface AppRepository {
  mode: "local" | "remote" | "firebase";
  loadAppData: (userId: string) => Promise<AppData | null>;
  saveAppData: (userId: string, data: AppData) => Promise<void>;
  getDarkMode: () => boolean;
  setDarkMode: (darkMode: boolean) => void;
}

const LEGACY_DATA_KEY = "jobsprint_data";
const LEGACY_DARKMODE_KEY = "jobsprint_darkmode";

const USER_DATA_KEY_PREFIX = "jobsprint_data_v2";
const USER_SYNC_KEY_PREFIX = "jobsprint_last_sync";

const DEFAULT_WEEKLY_GOALS: WeeklyGoals = {
  target: 10,
  checklist: [
    { id: "cv", label: "CV updated?", completed: false },
    { id: "linkedin", label: "LinkedIn aligned?", completed: false },
    { id: "networking", label: "Networking done (min 2)?", completed: false },
    { id: "followups", label: "Follow-ups sent?", completed: false },
  ],
};

function userDataKey(userId: string) {
  return `${USER_DATA_KEY_PREFIX}_${userId}`;
}

function userSyncKey(userId: string) {
  return `${USER_SYNC_KEY_PREFIX}_${userId}`;
}

function normalizeData(raw: unknown): AppData | null {
  if (!raw || typeof raw !== "object") return null;
  const maybe = raw as Partial<AppData>;

  if (!Array.isArray(maybe.applications)) return null;

  return {
    applications: maybe.applications,
    weeklyGoals: maybe.weeklyGoals || DEFAULT_WEEKLY_GOALS,
  };
}

export function migrateLegacyLocalData(storage: StorageLike, userId: string) {
  const migratedMarkerKey = `jobsprint_migrated_v1_${userId}`;
  const alreadyMigrated = storage.getItem(migratedMarkerKey) === "true";
  if (alreadyMigrated) {
    return { migrated: false, data: null as AppData | null };
  }

  const legacyRaw = storage.getItem(LEGACY_DATA_KEY);
  if (!legacyRaw) {
    return { migrated: false, data: null as AppData | null };
  }

  try {
    const parsed = JSON.parse(legacyRaw);
    const normalized = normalizeData(parsed);
    if (!normalized) {
      return { migrated: false, data: null as AppData | null };
    }
    storage.setItem(userDataKey(userId), JSON.stringify(normalized));
    storage.setItem(migratedMarkerKey, "true");
    return { migrated: true, data: normalized };
  } catch {
    return { migrated: false, data: null as AppData | null };
  }
}

function createLocalRepository(storage: StorageLike): AppRepository {
  return {
    mode: "local",
    async loadAppData(userId: string) {
      const migrated = migrateLegacyLocalData(storage, userId);
      if (migrated.data) return migrated.data;

      const raw = storage.getItem(userDataKey(userId));
      if (!raw) return null;

      try {
        return normalizeData(JSON.parse(raw));
      } catch {
        return null;
      }
    },
    async saveAppData(userId: string, data: AppData) {
      storage.setItem(userDataKey(userId), JSON.stringify(data));
      storage.setItem(userSyncKey(userId), new Date().toISOString());
    },
    getDarkMode() {
      const raw = storage.getItem(LEGACY_DARKMODE_KEY);
      return raw ? JSON.parse(raw) : true;
    },
    setDarkMode(darkMode: boolean) {
      storage.setItem(LEGACY_DARKMODE_KEY, JSON.stringify(darkMode));
    },
  };
}

function createRemoteRepository(storage: StorageLike, remoteBaseUrl: string): AppRepository {
  return {
    mode: "remote",
    async loadAppData(userId: string) {
      const response = await fetch(`${remoteBaseUrl}/state?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) {
        throw new Error(`Failed to load remote state: ${response.status}`);
      }
      const payload = await response.json();
      return normalizeData(payload);
    },
    async saveAppData(userId: string, data: AppData) {
      const response = await fetch(`${remoteBaseUrl}/state`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...data }),
      });
      if (!response.ok) {
        throw new Error(`Failed to save remote state: ${response.status}`);
      }
      storage.setItem(userSyncKey(userId), new Date().toISOString());
    },
    getDarkMode() {
      const raw = storage.getItem(LEGACY_DARKMODE_KEY);
      return raw ? JSON.parse(raw) : true;
    },
    setDarkMode(darkMode: boolean) {
      storage.setItem(LEGACY_DARKMODE_KEY, JSON.stringify(darkMode));
    },
  };
}

function createFirebaseRepository(storage: StorageLike): AppRepository {
  const firebase = getFirebaseContext();
  if (!firebase) {
    throw new Error("Firebase configuration is missing.");
  }

  return {
    mode: "firebase",
    async loadAppData(userId: string) {
      try {
        const migration = migrateLegacyLocalData(storage, userId);
        if (migration.migrated && migration.data) {
          const migrationDocRef = doc(firebase.db, "users", userId, "state", "app");
          await setDoc(migrationDocRef, migration.data, { merge: true });
        }

        const stateDocRef = doc(firebase.db, "users", userId, "state", "app");
        const stateDoc = await getDoc(stateDocRef);
        if (!stateDoc.exists()) {
          const localRaw = storage.getItem(userDataKey(userId));
          if (!localRaw) return null;
          try {
            return normalizeData(JSON.parse(localRaw));
          } catch {
            return null;
          }
        }

        const normalized = normalizeData(stateDoc.data());
        if (normalized) {
          storage.setItem(userDataKey(userId), JSON.stringify(normalized));
        }
        return normalized;
      } catch (error) {
        const message =
          error instanceof Error ? error.message.toLowerCase() : "";
        const offlineLike =
          message.includes("offline") ||
          message.includes("network") ||
          message.includes("unavailable");

        if (!offlineLike) {
          throw error;
        }

        const localRaw = storage.getItem(userDataKey(userId));
        if (!localRaw) return null;
        try {
          return normalizeData(JSON.parse(localRaw));
        } catch {
          return null;
        }
      }
    },
    async saveAppData(userId: string, data: AppData) {
      storage.setItem(userDataKey(userId), JSON.stringify(data));
      const stateDocRef = doc(firebase.db, "users", userId, "state", "app");
      try {
        await setDoc(stateDocRef, data, { merge: true });
      } catch (error) {
        const message =
          error instanceof Error ? error.message.toLowerCase() : "";
        const offlineLike =
          message.includes("offline") ||
          message.includes("network") ||
          message.includes("unavailable");
        if (!offlineLike) {
          throw error;
        }
      }
      storage.setItem(userSyncKey(userId), new Date().toISOString());
    },
    getDarkMode() {
      const raw = storage.getItem(LEGACY_DARKMODE_KEY);
      return raw ? JSON.parse(raw) : true;
    },
    setDarkMode(darkMode: boolean) {
      storage.setItem(LEGACY_DARKMODE_KEY, JSON.stringify(darkMode));
    },
  };
}

export function createRepository(storage: StorageLike): AppRepository {
  const firebase = getFirebaseContext();
  if (firebase) {
    return createFirebaseRepository(storage);
  }
  const remoteBaseUrl = (import.meta.env.VITE_JSPRINT_REMOTE_API_URL || "").trim();
  if (remoteBaseUrl) {
    return createRemoteRepository(storage, remoteBaseUrl);
  }
  return createLocalRepository(storage);
}

export const DEFAULT_APP_DATA: AppData = {
  applications: [],
  weeklyGoals: DEFAULT_WEEKLY_GOALS,
};

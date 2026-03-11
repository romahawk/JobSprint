import { useSyncExternalStore } from "react";

export interface JobOsSyncSnapshot {
  pendingWrites: number;
  lastSyncedAt: string | null;
  syncNotice: string | null;
  storageMode: "firebase" | "local";
  dataUserId: string | null;
  authUid: string | null;
  email: string | null;
}

const EMPTY_SNAPSHOT: JobOsSyncSnapshot = {
  pendingWrites: 0,
  lastSyncedAt: null,
  syncNotice: null,
  storageMode: "local",
  dataUserId: null,
  authUid: null,
  email: null,
};

let snapshot: JobOsSyncSnapshot = EMPTY_SNAPSHOT;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function updateJobOsSyncSnapshot(
  updates: Partial<JobOsSyncSnapshot>
): void {
  snapshot = { ...snapshot, ...updates };
  emit();
}

export function resetJobOsSyncSnapshot(): void {
  snapshot = EMPTY_SNAPSHOT;
  emit();
}

export function useJobOsSyncSnapshot(): JobOsSyncSnapshot {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => snapshot,
    () => snapshot
  );
}

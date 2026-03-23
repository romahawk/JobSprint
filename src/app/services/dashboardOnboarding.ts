import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseContext } from "./firebase";

const LOCAL_KEY = "jobsprint_onboarding_skipped";

/**
 * Reads the onboarding-skipped flag for a user.
 * Checks localStorage first (fast path), then falls back to Firestore.
 * Caches a positive Firestore result in localStorage for offline resilience.
 */
export async function getOnboardingSkipped(userId: string): Promise<boolean> {
  if (localStorage.getItem(LOCAL_KEY) === "1") return true;
  try {
    const ctx = getFirebaseContext();
    if (!ctx) return false;
    const ref = doc(ctx.db, "users", userId, "settings", "dashboard");
    const snap = await getDoc(ref);
    const skipped = snap.data()?.onboardingSkipped === true;
    if (skipped) localStorage.setItem(LOCAL_KEY, "1");
    return skipped;
  } catch {
    return false;
  }
}

/**
 * Marks onboarding as skipped for a user.
 * Writes to localStorage immediately and persists to Firestore best-effort.
 */
export async function markOnboardingSkipped(userId: string): Promise<void> {
  localStorage.setItem(LOCAL_KEY, "1");
  try {
    const ctx = getFirebaseContext();
    if (!ctx) return;
    const ref = doc(ctx.db, "users", userId, "settings", "dashboard");
    await setDoc(ref, { onboardingSkipped: true }, { merge: true });
  } catch {
    // localStorage already written — Firestore is best-effort
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseContext } from "./firebase";

export type DashboardOnboardingStatus = "pending" | "dismissed" | "completed";

const ONBOARDING_STATUS_KEY_PREFIX = "jobsprint_dashboard_onboarding_v1";

function isDashboardOnboardingStatus(
  value: unknown
): value is DashboardOnboardingStatus {
  return (
    value === "pending" ||
    value === "dismissed" ||
    value === "completed"
  );
}

export function getDashboardOnboardingStorageKey(userId: string) {
  return `${ONBOARDING_STATUS_KEY_PREFIX}_${userId}`;
}

export function readDashboardOnboardingStatus(
  userId: string
): DashboardOnboardingStatus | null {
  try {
    const raw = localStorage.getItem(getDashboardOnboardingStorageKey(userId));
    return isDashboardOnboardingStatus(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeDashboardOnboardingStatus(
  userId: string,
  status: DashboardOnboardingStatus
) {
  localStorage.setItem(getDashboardOnboardingStorageKey(userId), status);
}

export async function loadDashboardOnboardingStatus(
  userId: string
): Promise<DashboardOnboardingStatus | null> {
  const localStatus = readDashboardOnboardingStatus(userId);
  const firebase = getFirebaseContext();

  if (!firebase) {
    return localStatus;
  }

  try {
    const dashboardSettingsRef = doc(
      firebase.db,
      "users",
      userId,
      "settings",
      "dashboard"
    );
    const snapshot = await getDoc(dashboardSettingsRef);
    const remoteStatus = snapshot.exists()
      ? snapshot.data().onboardingStatus
      : null;

    if (isDashboardOnboardingStatus(remoteStatus)) {
      writeDashboardOnboardingStatus(userId, remoteStatus);
      return remoteStatus;
    }

    return localStatus;
  } catch {
    return localStatus;
  }
}

export async function persistDashboardOnboardingStatus(
  userId: string,
  status: DashboardOnboardingStatus
): Promise<void> {
  writeDashboardOnboardingStatus(userId, status);

  const firebase = getFirebaseContext();
  if (!firebase) {
    return;
  }

  try {
    const dashboardSettingsRef = doc(
      firebase.db,
      "users",
      userId,
      "settings",
      "dashboard"
    );
    await setDoc(
      dashboardSettingsRef,
      {
        onboardingStatus: status,
        onboardingUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    // Keep the local cache authoritative when the network is unavailable.
  }
}

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

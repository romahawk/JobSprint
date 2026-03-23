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
  }
}

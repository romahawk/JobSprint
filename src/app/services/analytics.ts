import { logEvent } from "firebase/analytics";
import { getFirebaseContext } from "./firebase";

type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

export function trackAnalyticsEvent(
  eventName: string,
  params?: AnalyticsParams
): void {
  const firebase = getFirebaseContext();
  if (!firebase?.analytics) {
    if (import.meta.env.DEV) {
      console.warn("[analytics] analytics instance unavailable; event dropped:", eventName);
    }
    return;
  }
  const payload = import.meta.env.DEV
    ? { ...params, debug_mode: true }
    : params;
  logEvent(firebase.analytics, eventName, payload);
  if (import.meta.env.DEV) {
    console.info("[analytics] event sent:", eventName, payload);
  }
}

export function trackPageView(path: string): void {
  if (typeof window === "undefined") return;
  trackAnalyticsEvent("page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title || "JobSprint",
  });
}

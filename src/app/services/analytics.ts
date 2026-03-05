import { logEvent } from "firebase/analytics";
import { getFirebaseContext } from "./firebase";

type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

export function trackAnalyticsEvent(
  eventName: string,
  params?: AnalyticsParams
): void {
  const firebase = getFirebaseContext();
  if (!firebase?.analytics) return;
  logEvent(firebase.analytics, eventName, params);
}

export function trackPageView(path: string): void {
  if (typeof window === "undefined") return;
  trackAnalyticsEvent("page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title || "JobSprint",
  });
}

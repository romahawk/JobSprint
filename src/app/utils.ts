import type { JobOsApplication } from "./types/jobOs";

// ─── Job OS metric utilities ──────────────────────────────────────────────────

const JOB_OS_RESPONDED_STATUSES = new Set([
  "screen",
  "case",
  "interview",
  "final",
  "offer",
  "rejected",
]);
const JOB_OS_INTERVIEWED_STATUSES = new Set(["interview", "final", "offer"]);

export function getJobOsThisWeekCount(applications: JobOsApplication[]): number {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return applications.filter((app) => new Date(app.dateApplied) >= startOfWeek).length;
}

export function getJobOsWeeklyStats(
  applications: JobOsApplication[]
): { week: string; count: number }[] {
  const weeks: Record<string, number> = {};
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i * 7);
    weeks[formatWeekLabel(d)] = 0;
  }
  applications.forEach((app) => {
    const label = formatWeekLabel(new Date(app.dateApplied));
    if (Object.prototype.hasOwnProperty.call(weeks, label)) weeks[label]++;
  });
  return Object.entries(weeks).map(([week, count]) => ({ week, count }));
}

export function getJobOsResponseRateTrend(
  applications: JobOsApplication[]
): { week: string; rate: number }[] {
  const weeks = getJobOsWeeklyStats(applications);
  return weeks.map(({ week }) => {
    const weekApps = applications.filter(
      (app) => formatWeekLabel(new Date(app.dateApplied)) === week
    );
    const responded = weekApps.filter((app) =>
      JOB_OS_RESPONDED_STATUSES.has(app.status)
    ).length;
    const rate = weekApps.length > 0 ? (responded / weekApps.length) * 100 : 0;
    return { week, rate: Math.round(rate) };
  });
}

export function getJobOsMetrics(applications: JobOsApplication[]) {
  const total = applications.length;
  const thisWeekCount = getJobOsThisWeekCount(applications);
  const respondedCount = applications.filter((app) =>
    JOB_OS_RESPONDED_STATUSES.has(app.status)
  ).length;
  const interviewCount = applications.filter((app) =>
    JOB_OS_INTERVIEWED_STATUSES.has(app.status)
  ).length;
  const offers = applications.filter((app) => app.status === "offer").length;
  const responseRate = total > 0 ? (respondedCount / total) * 100 : 0;
  const interviewRate = respondedCount > 0 ? (interviewCount / respondedCount) * 100 : 0;
  const offerRate = interviewCount > 0 ? (offers / interviewCount) * 100 : 0;
  return {
    total,
    thisWeekCount,
    respondedCount,
    interviewCount,
    offers,
    responseRate,
    interviewRate,
    offerRate,
  };
}

// ─── Probability engine (pure math, no model dependency) ─────────────────────

export function calculateProbabilityScenarios(
  appliedCount: number,
  responseRate: number,
  interviewRate: number,
  offerRate: number
) {
  const conservative = {
    response: responseRate * 0.8,
    interview: interviewRate * 0.8,
    offer: offerRate * 0.8,
    probability:
      (responseRate * 0.8 * interviewRate * 0.8 * offerRate * 0.8) / 1000000,
  };

  const realistic = {
    response: responseRate,
    interview: interviewRate,
    offer: offerRate,
    probability: (responseRate * interviewRate * offerRate) / 1000000,
  };

  const strong = {
    response: Math.min(responseRate * 1.2, 100),
    interview: Math.min(interviewRate * 1.2, 100),
    offer: Math.min(offerRate * 1.2, 100),
    probability:
      (Math.min(responseRate * 1.2, 100) *
        Math.min(interviewRate * 1.2, 100) *
        Math.min(offerRate * 1.2, 100)) /
      1000000,
  };

  const lambda = realistic.probability * appliedCount;
  const probabilityOfOffer = lambda > 0 ? (1 - Math.exp(-lambda)) * 100 : 0;

  return { conservative, realistic, strong, probabilityOfOffer };
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatWeekLabel(date: Date) {
  const month = date.toLocaleString("default", { month: "short" });
  return `${month} ${date.getDate()}`;
}

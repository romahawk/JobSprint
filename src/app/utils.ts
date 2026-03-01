import type { Application } from "./types";

export const STATUS_LABELS: Record<string, string> = {
  targeted: "Targeted",
  applied: "Applied",
  hr_screen: "HR Screen",
  interview: "Interview",
  final_round: "Final Round",
  offer: "Offer",
  rejected: "Rejected",
};

export const STATUS_ORDER = [
  "targeted",
  "applied",
  "hr_screen",
  "interview",
  "final_round",
  "offer",
  "rejected",
];

export function calculateMetrics(applications: Application[]) {
  const total = applications.length;
  const thisWeek = getThisWeekApplications(applications).length;

  // Response rate: (HR Screen + Interview + Final + Offer) / Applied
  const appliedCount = applications.filter(
    (app) =>
      app.status === "applied" ||
      app.status === "hr_screen" ||
      app.status === "interview" ||
      app.status === "final_round" ||
      app.status === "offer"
  ).length;

  const respondedCount = applications.filter(
    (app) =>
      app.status === "hr_screen" ||
      app.status === "interview" ||
      app.status === "final_round" ||
      app.status === "offer"
  ).length;

  const responseRate = appliedCount > 0 ? (respondedCount / appliedCount) * 100 : 0;

  // Interview rate: (Interview + Final + Offer) / Responded
  const interviewCount = applications.filter(
    (app) =>
      app.status === "interview" ||
      app.status === "final_round" ||
      app.status === "offer"
  ).length;

  const interviewRate =
    respondedCount > 0 ? (interviewCount / respondedCount) * 100 : 0;

  // Scheduled interviews (Interview + Final stages)
  const interviewsScheduled = applications.filter(
    (app) => app.status === "interview" || app.status === "final_round"
  ).length;

  // Offers
  const offers = applications.filter((app) => app.status === "offer").length;

  // Offer rate: Offers / Interviews
  const offerRate = interviewCount > 0 ? (offers / interviewCount) * 100 : 0;

  // Expected offers calculation
  const estimatedOfferProbability =
    (responseRate / 100) * (interviewRate / 100) * (offerRate / 100) * 100;

  return {
    total,
    thisWeek,
    responseRate,
    interviewRate,
    interviewsScheduled,
    offers,
    offerRate,
    estimatedOfferProbability,
    appliedCount,
    respondedCount,
    interviewCount,
  };
}

export function getThisWeekApplications(applications: Application[]) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  return applications.filter((app) => {
    const appDate = new Date(app.dateApplied);
    return appDate >= startOfWeek;
  });
}

export function calculateProbabilityScenarios(
  appliedCount: number,
  responseRate: number,
  interviewRate: number,
  offerRate: number
) {
  // Conservative (reduce each rate by 20%)
  const conservative = {
    response: responseRate * 0.8,
    interview: interviewRate * 0.8,
    offer: offerRate * 0.8,
    probability:
      (responseRate * 0.8 * interviewRate * 0.8 * offerRate * 0.8) / 1000000,
  };

  // Realistic (use current rates)
  const realistic = {
    response: responseRate,
    interview: interviewRate,
    offer: offerRate,
    probability: (responseRate * interviewRate * offerRate) / 1000000,
  };

  // Strong (increase each rate by 20%, cap at 100%)
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

  // Probability of at least 1 offer using Poisson approximation
  // P(X >= 1) = 1 - P(X = 0) = 1 - e^(-lambda)
  const lambda = realistic.probability * appliedCount;
  const probabilityOfOffer = lambda > 0 ? (1 - Math.exp(-lambda)) * 100 : 0;

  return {
    conservative,
    realistic,
    strong,
    probabilityOfOffer,
  };
}

export function getWeeklyStats(applications: Application[]) {
  const weeks: Record<string, number> = {};
  const now = new Date();

  // Get last 8 weeks
  for (let i = 7; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i * 7);
    const weekLabel = formatWeekLabel(date);
    weeks[weekLabel] = 0;
  }

  applications.forEach((app) => {
    const appDate = new Date(app.dateApplied);
    const weekLabel = formatWeekLabel(appDate);
    if (weeks.hasOwnProperty(weekLabel)) {
      weeks[weekLabel]++;
    }
  });

  return Object.entries(weeks).map(([week, count]) => ({ week, count }));
}

function formatWeekLabel(date: Date) {
  const month = date.toLocaleString("default", { month: "short" });
  const day = date.getDate();
  return `${month} ${day}`;
}

export function getResponseRateTrend(applications: Application[]) {
  const weeks = getWeeklyStats(applications);

  return weeks.map((week) => {
    const weekApps = applications.filter((app) => {
      const appWeek = formatWeekLabel(new Date(app.dateApplied));
      return appWeek === week.week;
    });

    const applied = weekApps.filter(
      (app) =>
        app.status === "applied" ||
        app.status === "hr_screen" ||
        app.status === "interview" ||
        app.status === "final_round" ||
        app.status === "offer"
    ).length;

    const responded = weekApps.filter(
      (app) =>
        app.status === "hr_screen" ||
        app.status === "interview" ||
        app.status === "final_round" ||
        app.status === "offer"
    ).length;

    const rate = applied > 0 ? (responded / applied) * 100 : 0;

    return {
      week: week.week,
      rate: Math.round(rate),
    };
  });
}

export function getConversionFunnel(applications: Application[]) {
  const applied = applications.filter(
    (app) =>
      app.status === "applied" ||
      app.status === "hr_screen" ||
      app.status === "interview" ||
      app.status === "final_round" ||
      app.status === "offer"
  ).length;

  const hrScreen = applications.filter(
    (app) =>
      app.status === "hr_screen" ||
      app.status === "interview" ||
      app.status === "final_round" ||
      app.status === "offer"
  ).length;

  const interview = applications.filter(
    (app) =>
      app.status === "interview" ||
      app.status === "final_round" ||
      app.status === "offer"
  ).length;

  const finalRound = applications.filter(
    (app) => app.status === "final_round" || app.status === "offer"
  ).length;

  const offer = applications.filter((app) => app.status === "offer").length;

  return [
    { stage: "Applied", count: applied },
    { stage: "HR Screen", count: hrScreen },
    { stage: "Interview", count: interview },
    { stage: "Final Round", count: finalRound },
    { stage: "Offer", count: offer },
  ];
}

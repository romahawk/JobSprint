import type {
  Application,
  NextActionTask,
  OpportunityScore,
  UserProfileSignals,
  ActionType,
  TaskPriority,
} from "../types";

// ── Scoring ──────────────────────────────────────────────────────────────────

function scoreRoleMatch(application: Application, signals?: UserProfileSignals): number {
  if (!signals || signals.targetRoles.length === 0) return 20;

  const roleNorm = application.role.toLowerCase();
  const tokens = roleNorm.split(/\s+/);

  let best = 0;
  for (const target of signals.targetRoles) {
    const targetTokens = target.toLowerCase().split(/\s+/);
    const overlap = targetTokens.filter((t) => tokens.includes(t)).length;
    const score = targetTokens.length > 0 ? (overlap / targetTokens.length) * 40 : 0;
    if (score > best) best = score;
  }

  return Math.min(40, Math.round(best));
}

function scoreRecency(application: Application): number {
  const applied = new Date(application.dateApplied).getTime();
  const now = Date.now();
  const days = (now - applied) / (1000 * 60 * 60 * 24);

  if (days <= 7) return 20;
  if (days <= 14) return 10;
  if (days <= 30) return 5;
  return 0;
}

function scoreCompanyTier(application: Application): number {
  if (application.priority === "high") return 20;
  if (application.priority === "medium") return 10;
  return 0;
}

function scoreUserFocus(application: Application, signals?: UserProfileSignals): number {
  if (!signals) return 10;

  const locNorm = application.location.toLowerCase();
  const isRemote = locNorm.includes("remote");

  if (signals.remoteOnly && isRemote) return 20;
  if (signals.remoteOnly && !isRemote) return 0;

  const locationMatch = signals.preferredLocations.some((loc) =>
    locNorm.includes(loc.toLowerCase())
  );

  return locationMatch ? 20 : 5;
}

export function scoreApplicationOpportunity(
  application: Application,
  signals?: UserProfileSignals
): OpportunityScore {
  const roleMatch = scoreRoleMatch(application, signals);
  const recency = scoreRecency(application);
  const companyTier = scoreCompanyTier(application);
  const userFocus = scoreUserFocus(application, signals);

  return {
    applicationId: application.id,
    total: roleMatch + recency + companyTier + userFocus,
    roleMatch,
    recency,
    companyTier,
    userFocus,
    scoredAt: new Date().toISOString(),
  };
}

// ── Task generation ───────────────────────────────────────────────────────────

type TaskDraft = Omit<NextActionTask, "id" | "createdAt" | "updatedAt">;

function hasOpenTask(
  existing: NextActionTask[],
  applicationId: string,
  action: ActionType
): boolean {
  return existing.some(
    (t) => t.applicationId === applicationId && t.action === action && t.status === "open"
  );
}

export function generateTasksForApplication(
  application: Application,
  score: OpportunityScore,
  existingTasks: NextActionTask[]
): TaskDraft[] {
  const { id: applicationId, status } = application;
  const total = score.total;

  // Statuses that mean we should clear, not generate
  if (status === "interview" || status === "final_round" || status === "offer" || status === "rejected") {
    // Auto-create follow_up when applied only
    return [];
  }

  const emit = (action: ActionType, priority: TaskPriority, dueDate?: string): TaskDraft | null => {
    if (hasOpenTask(existingTasks, applicationId, action)) return null;
    const draft: TaskDraft = { applicationId, action, priority, status: "open" };
    if (dueDate) draft.dueDate = dueDate;
    return draft;
  };

  const tasks: TaskDraft[] = [];

  if (status === "applied") {
    const followUp = emit("follow_up", "normal", futureDateIso(5));
    if (followUp) tasks.push(followUp);
    return tasks;
  }

  // targeted or any pre-apply status
  if (status === "targeted") {
    const apply = emit("apply", "urgent");
    if (apply) tasks.push(apply);
  }

  if (total >= 60) {
    const apply = emit("apply", "urgent");
    if (apply) tasks.push(apply);
    const cvTailor = emit("cv_tailor", "high");
    if (cvTailor) tasks.push(cvTailor);
    const outreach = emit("outreach", "normal");
    if (outreach) tasks.push(outreach);
  } else if (total >= 40) {
    const apply = emit("apply", "high");
    if (apply) tasks.push(apply);
    const research = emit("research", "normal");
    if (research) tasks.push(research);
  } else {
    const research = emit("research", "low");
    if (research) tasks.push(research);
  }

  return tasks;
}

function futureDateIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ── Action summary ────────────────────────────────────────────────────────────

export interface ActionSummary {
  headline: string;
  subtext: string;
  urgentCount: number;
  totalCount: number;
}

const ACTION_LABELS: Record<ActionType, string> = {
  apply: "Apply",
  cv_tailor: "Tailor CV",
  outreach: "Outreach",
  follow_up: "Follow Up",
  research: "Research",
};

export function buildActionSummary(
  application: Application,
  score: OpportunityScore,
  tasks: NextActionTask[]
): ActionSummary {
  const open = tasks.filter(
    (t) => t.applicationId === application.id && t.status === "open"
  );
  const urgentCount = open.filter((t) => t.priority === "urgent").length;
  const totalCount = open.length;

  const headline = `${application.company} — ${application.role}`;
  let subtext: string;

  if (score.total >= 60) {
    subtext = `Strong match (${score.total}/100). Prioritise applying and tailoring your CV.`;
  } else if (score.total >= 40) {
    subtext = `Moderate fit (${score.total}/100). Apply and do a bit more research first.`;
  } else {
    subtext = `Lower signal (${score.total}/100). Research before investing more time.`;
  }

  if (totalCount > 0) {
    const labels = open
      .slice(0, 3)
      .map((t) => ACTION_LABELS[t.action])
      .join(", ");
    subtext += ` Next: ${labels}.`;
  }

  return { headline, subtext, urgentCount, totalCount };
}

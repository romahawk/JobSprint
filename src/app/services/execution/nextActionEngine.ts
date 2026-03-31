import type {
  JobOsCompany,
  JobOsOutreach,
  JobOsRole,
  JobOsApplication,
  CompanyPriority,
} from "../../types/jobOs";

// ─── Public Types ─────────────────────────────────────────────────────────────

export type NextActionType =
  | "apply"
  | "log_application"
  | "follow_up"
  | "add_role"
  | "research"
  | "optimize_cv"
  | "archive";

export type ActionPriority = "urgent" | "high" | "medium" | "low";

export interface NextAction {
  id: string;
  type: NextActionType;
  priority: ActionPriority;
  /** 0–100 composite score */
  score: number;
  companyId?: string;
  companyName?: string;
  roleId?: string;
  roleTitle?: string;
  applicationId?: string;
  reason: string;
  actionLabel: string;
  /** Deep link into the relevant Job OS page */
  href: string;
}

export interface EngineInput {
  companies: JobOsCompany[];
  roles: JobOsRole[];
  applications: JobOsApplication[];
  outreach?: JobOsOutreach[];
}

// ─── Scoring Constants ────────────────────────────────────────────────────────

const PRIORITY_WEIGHT: Record<CompanyPriority, number> = { A: 30, B: 15, C: 5 };
const FIT_WEIGHT = 5; // per fitScore point (1–5)
const FOLLOW_UP_BASE = 60;
const APPLY_BASE = 50;
const LOG_APPLICATION_BASE = 65;
const OPTIMIZE_CV_BASE = 70;
const ADD_ROLE_BASE = 40;
const RESEARCH_BASE = 25;
const ARCHIVE_BASE = 10;

// Days thresholds
const FOLLOW_UP_DAYS = 7;
const STALE_ROLE_DAYS = 30;
const ARCHIVE_DAYS = 21;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(dateStr: string | undefined): number {
  if (!dateStr) return 0;
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function toPriority(score: number): ActionPriority {
  if (score >= 80) return "urgent";
  if (score >= 55) return "high";
  if (score >= 35) return "medium";
  return "low";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ─── Rule Generators ─────────────────────────────────────────────────────────

function generateApplyActions(
  roles: JobOsRole[],
  companies: JobOsCompany[],
  applications: JobOsApplication[]
): NextAction[] {
  const companyMap = new Map(companies.map((c) => [c.id, c]));
  const appliedRoleIds = new Set(applications.map((a) => a.roleId));

  return roles
    .filter((r) => r.status === "to_apply" && !appliedRoleIds.has(r.id))
    .map((role) => {
      const company = companyMap.get(role.companyId);
      const priorityBonus = company ? PRIORITY_WEIGHT[company.priority] : 0;
      const fitBonus = role.fitScore * FIT_WEIGHT;
      const stalePenalty = daysSince(role.createdAt) > STALE_ROLE_DAYS ? 10 : 0;
      const score = clamp(APPLY_BASE + priorityBonus + fitBonus - stalePenalty, 0, 100);

      return {
        id: `apply-${role.id}`,
        type: "apply" as NextActionType,
        priority: toPriority(score),
        score,
        companyId: role.companyId,
        companyName: company?.name,
        roleId: role.id,
        roleTitle: role.title,
        reason: `Fit score ${role.fitScore}/5${company ? ` · ${company.priority}-priority target` : ""}`,
        actionLabel: "Apply Now",
        href: "/job-os/roles",
      };
    });
}

function generateFollowUpActions(
  applications: JobOsApplication[],
  companies: JobOsCompany[]
): NextAction[] {
  const companyMap = new Map(companies.map((c) => [c.id, c]));

  return applications
    .filter(
      (a) =>
        (a.status === "sent" || a.status === "screen") &&
        daysSince(a.lastResponseAt ?? a.dateApplied) >= FOLLOW_UP_DAYS
    )
    .map((app) => {
      const company = companyMap.get(app.companyId);
      const priorityBonus = company ? PRIORITY_WEIGHT[company.priority] : 0;
      const days = daysSince(app.lastResponseAt ?? app.dateApplied);
      const urgencyBonus = Math.min(days * 1.5, 20);
      const score = clamp(FOLLOW_UP_BASE + priorityBonus + urgencyBonus, 0, 100);

      return {
        id: `follow-up-${app.id}`,
        type: "follow_up" as NextActionType,
        priority: toPriority(score),
        score,
        companyId: app.companyId,
        companyName: company?.name,
        applicationId: app.id,
        reason: `Applied ${days} day${days !== 1 ? "s" : ""} ago — no response yet`,
        actionLabel: "Follow Up",
        href: "/job-os/applications",
      };
    });
}

function generateLogApplicationActions(
  roles: JobOsRole[],
  companies: JobOsCompany[],
  applications: JobOsApplication[]
): NextAction[] {
  const companyMap = new Map(companies.map((c) => [c.id, c]));
  const appliedRoleIds = new Set(applications.map((a) => a.roleId));

  return roles
    .filter(
      (role) =>
        role.status !== "to_apply" &&
        role.status !== "closed" &&
        !appliedRoleIds.has(role.id)
    )
    .map((role) => {
      const company = companyMap.get(role.companyId);
      const priorityBonus = company ? PRIORITY_WEIGHT[company.priority] : 0;
      const fitBonus = role.fitScore * FIT_WEIGHT;
      const score = clamp(LOG_APPLICATION_BASE + priorityBonus + fitBonus, 0, 100);

      return {
        id: `log-application-${role.id}`,
        type: "log_application" as NextActionType,
        priority: toPriority(score),
        score,
        companyId: role.companyId,
        companyName: company?.name,
        roleId: role.id,
        roleTitle: role.title,
        reason: `Role is marked ${role.status} but no application record exists yet`,
        actionLabel: "Log Application",
        href: "/job-os/roles",
      };
    });
}

function generateOptimizeCvActions(
  applications: JobOsApplication[],
  companies: JobOsCompany[]
): NextAction[] {
  const companyMap = new Map(companies.map((c) => [c.id, c]));

  return applications
    .filter(
      (a) =>
        (a.status === "interview" || a.status === "final" || a.status === "case") &&
        !a.tailoredCvText
    )
    .map((app) => {
      const company = companyMap.get(app.companyId);
      const priorityBonus = company ? PRIORITY_WEIGHT[company.priority] : 0;
      const score = clamp(OPTIMIZE_CV_BASE + priorityBonus, 0, 100);

      return {
        id: `optimize-cv-${app.id}`,
        type: "optimize_cv" as NextActionType,
        priority: toPriority(score),
        score,
        companyId: app.companyId,
        companyName: company?.name,
        applicationId: app.id,
        reason: "Interview stage — tailor your CV to maximise impact",
        actionLabel: "Tailor CV",
        href: "/cv-optimizer",
      };
    });
}

function generateAddRoleActions(
  companies: JobOsCompany[],
  roles: JobOsRole[]
): NextAction[] {
  const companiesWithRoles = new Set(roles.map((r) => r.companyId));

  return companies
    .filter(
      (c) =>
        !companiesWithRoles.has(c.id) &&
        (c.status === "Active" || c.status === "Target")
    )
    .map((company) => {
      const priorityBonus = PRIORITY_WEIGHT[company.priority];
      const score = clamp(ADD_ROLE_BASE + priorityBonus, 0, 100);

      return {
        id: `add-role-${company.id}`,
        type: "add_role" as NextActionType,
        priority: toPriority(score),
        score,
        companyId: company.id,
        companyName: company.name,
        reason: `${company.status} company — no roles tracked yet`,
        actionLabel: "Add Role",
        href: "/job-os/companies",
      };
    });
}

function generateResearchActions(
  companies: JobOsCompany[],
  roles: JobOsRole[]
): NextAction[] {
  const companiesWithRoles = new Set(roles.map((r) => r.companyId));

  return companies
    .filter(
      (c) =>
        !companiesWithRoles.has(c.id) &&
        c.status === "Research" &&
        c.priority === "A"
    )
    .map((company) => ({
      id: `research-${company.id}`,
      type: "research" as NextActionType,
      priority: "medium" as ActionPriority,
      score: RESEARCH_BASE + PRIORITY_WEIGHT[company.priority],
      companyId: company.id,
      companyName: company.name,
      reason: "A-priority target in research — find open roles",
      actionLabel: "Research",
      href: "/job-os/companies",
    }));
}

function generateArchiveActions(
  applications: JobOsApplication[],
  companies: JobOsCompany[]
): NextAction[] {
  const companyMap = new Map(companies.map((c) => [c.id, c]));

  return applications
    .filter(
      (a) =>
        (a.status === "rejected" || a.status === "ghosted") &&
        daysSince(a.updatedAt) >= ARCHIVE_DAYS
    )
    .slice(0, 3) // cap to avoid noise
    .map((app) => {
      const company = companyMap.get(app.companyId);
      return {
        id: `archive-${app.id}`,
        type: "archive" as NextActionType,
        priority: "low" as ActionPriority,
        score: ARCHIVE_BASE,
        companyId: app.companyId,
        companyName: company?.name,
        applicationId: app.id,
        reason: "Keep your pipeline clean — close stale applications",
        actionLabel: "Archive",
        href: "/job-os/applications",
      };
    });
}

// ─── Follow-up Intelligence ───────────────────────────────────────────────────

const STALLED_APPLIED_DAYS = 14;
const STALLED_SCREEN_DAYS = 7;
const FOLLOWUP_SCORE_BASE = 60;
const FOLLOWUP_SCORE_PER_DAY = 5;
const FOLLOWUP_SCORE_CAP = 90;

function generateStalledApplicationActions(
  applications: JobOsApplication[],
  outreach: JobOsOutreach[],
  companies: JobOsCompany[]
): NextAction[] {
  const companyMap = new Map(companies.map((c) => [c.id, c]));
  const outreachByRole = new Map<string, JobOsOutreach[]>();
  for (const o of outreach) {
    if (o.roleId) {
      const list = outreachByRole.get(o.roleId) ?? [];
      list.push(o);
      outreachByRole.set(o.roleId, list);
    }
  }

  const actions: NextAction[] = [];

  for (const app of applications) {
    if (app.status === "rejected" || app.status === "ghosted" || app.status === "offer") continue;

    const company = companyMap.get(app.companyId);
    const priorityBonus = company ? PRIORITY_WEIGHT[company.priority] : 0;
    const linkedOutreach = outreachByRole.get(app.roleId) ?? [];
    const days = daysSince(app.dateApplied);

    if (app.status === "sent" && days >= STALLED_APPLIED_DAYS) {
      const hasActiveOutreach = linkedOutreach.some(
        (o) => o.status !== "no_reply" && o.status !== "closed"
      );
      const overdueBonus = Math.min((days - STALLED_APPLIED_DAYS) * FOLLOWUP_SCORE_PER_DAY, 30);
      const score = clamp(FOLLOWUP_SCORE_BASE + priorityBonus + overdueBonus, 0, FOLLOWUP_SCORE_CAP);

      if (hasActiveOutreach) {
        actions.push({
          id: `re-engage-${app.id}`,
          type: "follow_up",
          priority: toPriority(score),
          score,
          companyId: app.companyId,
          companyName: company?.name,
          applicationId: app.id,
          reason: `Re-engage — last message was ${days} days ago`,
          actionLabel: "Re-engage",
          href: "/job-os/outreach",
        });
      } else {
        actions.push({
          id: `stalled-${app.id}`,
          type: "follow_up",
          priority: toPriority(score),
          score,
          companyId: app.companyId,
          companyName: company?.name,
          applicationId: app.id,
          reason: `Applied ${days} days ago — no outreach logged`,
          actionLabel: "Log Outreach",
          href: "/job-os/outreach",
        });
      }
    }

    if (app.status === "screen" && days >= STALLED_SCREEN_DAYS) {
      const score = clamp(FOLLOWUP_SCORE_BASE + priorityBonus, 0, FOLLOWUP_SCORE_CAP);
      actions.push({
        id: `screen-stalled-${app.id}`,
        type: "follow_up",
        priority: toPriority(score),
        score,
        companyId: app.companyId,
        companyName: company?.name,
        applicationId: app.id,
        reason: `Screener stage for ${days} days — check status`,
        actionLabel: "Check Status",
        href: "/job-os/applications",
      });
    }
  }

  return actions;
}

function generateOverdueOutreachActions(
  outreach: JobOsOutreach[],
  companies: JobOsCompany[]
): NextAction[] {
  const companyMap = new Map(companies.map((c) => [c.id, c]));
  const today = new Date().toISOString().slice(0, 10);

  return outreach
    .filter(
      (o) =>
        o.status !== "closed" &&
        o.nextFollowUpDate &&
        o.nextFollowUpDate <= today
    )
    .map((o) => {
      const company = companyMap.get(o.companyId);
      const priorityBonus = company ? PRIORITY_WEIGHT[company.priority] : 0;
      const overdueDays = daysSince(o.nextFollowUpDate ?? today);
      const score = clamp(
        FOLLOWUP_SCORE_BASE + priorityBonus + Math.min(overdueDays * FOLLOWUP_SCORE_PER_DAY, 30),
        0,
        FOLLOWUP_SCORE_CAP
      );

      return {
        id: `overdue-outreach-${o.id}`,
        type: "follow_up" as NextActionType,
        priority: toPriority(score),
        score,
        companyId: o.companyId,
        companyName: company?.name,
        reason: `Follow-up with ${o.contactName || "contact"} at ${company?.name ?? "company"} is overdue`,
        actionLabel: "Follow Up",
        href: "/job-os/outreach",
      };
    });
}

// ─── Hot Opportunities ────────────────────────────────────────────────────────

export interface HotOpportunity {
  roleId: string;
  roleTitle: string;
  companyId: string;
  companyName: string;
  priority: CompanyPriority;
  fitScore: 1 | 2 | 3 | 4 | 5;
  score: number;
  reason: string;
  href: string;
}

export function getHotOpportunities(
  roles: JobOsRole[],
  companies: JobOsCompany[],
  applications: JobOsApplication[]
): HotOpportunity[] {
  const companyMap = new Map(companies.map((c) => [c.id, c]));
  const appliedRoleIds = new Set(applications.map((a) => a.roleId));

  return roles
    .filter((r) => r.status === "to_apply" && !appliedRoleIds.has(r.id))
    .map((role) => {
      const company = companyMap.get(role.companyId);
      const priorityBonus = company ? PRIORITY_WEIGHT[company.priority] : 0;
      const score = clamp(priorityBonus + role.fitScore * FIT_WEIGHT, 0, 100);
      const reasons: string[] = [];
      if (company?.priority === "A") reasons.push("A-priority company");
      if (role.fitScore >= 4) reasons.push(`fit ${role.fitScore}/5`);
      if (role.sourceType === "link") reasons.push("imported via link");

      return {
        roleId: role.id,
        roleTitle: role.title,
        companyId: role.companyId,
        companyName: company?.name ?? "Unknown",
        priority: company?.priority ?? "C",
        fitScore: role.fitScore,
        score,
        reason: reasons.join(" · ") || `Fit score ${role.fitScore}/5`,
        href: "/job-os/roles",
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// ─── Pipeline Stats ───────────────────────────────────────────────────────────

export interface PipelineStats {
  totalCompanies: number;
  totalRoles: number;
  toApply: number;
  applied: number;
  inReview: number;
  interviewing: number;
  offers: number;
  conversionRate: number; // interviews / applied * 100
  responseRate: number;   // got any response / applied * 100
  interviewRate: number;  // reached interview / responded * 100
  offerRate: number;      // offers / interviewed * 100
}

export function getPipelineStats(
  companies: JobOsCompany[],
  roles: JobOsRole[],
  applications: JobOsApplication[]
): PipelineStats {
  const toApply = roles.filter((r) => r.status === "to_apply").length;
  const applied = applications.length;
  const inReview = applications.filter(
    (a) => a.status === "sent" || a.status === "screen"
  ).length;
  const interviewing = applications.filter(
    (a) => a.status === "interview" || a.status === "final" || a.status === "case"
  ).length;
  const offers = applications.filter((a) => a.status === "offer").length;
  const responded = applications.filter((a) =>
    ["screen", "case", "interview", "final", "offer", "rejected"].includes(a.status)
  ).length;
  const interviewed = applications.filter((a) =>
    ["interview", "final", "offer"].includes(a.status)
  ).length;

  const conversionRate = applied > 0 ? Math.round((interviewing / applied) * 100) : 0;
  const responseRate = applied > 0 ? Math.round((responded / applied) * 100) : 0;
  const interviewRate = responded > 0 ? Math.round((interviewed / responded) * 100) : 0;
  const offerRate = interviewed > 0 ? Math.round((offers / interviewed) * 100) : 0;

  return {
    totalCompanies: companies.length,
    totalRoles: roles.length,
    toApply,
    applied,
    inReview,
    interviewing,
    offers,
    conversionRate,
    responseRate,
    interviewRate,
    offerRate,
  };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Generate and rank the top next actions the user should take right now.
 * Returns the top N actions sorted by score descending.
 */
export function getNextActions(
  data: EngineInput,
  limit = 5
): NextAction[] {
  const { companies, roles, applications, outreach = [] } = data;

  const all: NextAction[] = [
    ...generateOptimizeCvActions(applications, companies),
    ...generateOverdueOutreachActions(outreach, companies),
    ...generateStalledApplicationActions(applications, outreach, companies),
    ...generateFollowUpActions(applications, companies),
    ...generateLogApplicationActions(roles, companies, applications),
    ...generateApplyActions(roles, companies, applications),
    ...generateAddRoleActions(companies, roles),
    ...generateResearchActions(companies, roles),
    ...generateArchiveActions(applications, companies),
  ];

  // Deduplicate by id
  const seen = new Set<string>();
  const deduped = all.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  // For the same application, keep only the highest-scored action
  const byAppId = new Map<string, NextAction>();
  const noApp: NextAction[] = [];
  for (const action of deduped) {
    if (!action.applicationId) {
      noApp.push(action);
      continue;
    }
    const existing = byAppId.get(action.applicationId);
    if (!existing || action.score > existing.score) {
      byAppId.set(action.applicationId, action);
    }
  }

  return [...byAppId.values(), ...noApp]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

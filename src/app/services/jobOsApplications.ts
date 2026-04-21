import type { ApplicationStatus, JobOsApplication, JobOsCompany, JobOsRole } from "../types/jobOs";

export type ApplicationSortField =
  | "company"
  | "role"
  | "status"
  | "date"
  | "channel"
  | "nextAction"
  | "notes";
export type SortDirection = "asc" | "desc";

export const INTERVIEW_RELATED_APPLICATION_STATUSES = new Set<ApplicationStatus>([
  "interview",
  "final",
  "offer",
]);

export const CLOSED_APPLICATION_STATUSES = new Set<ApplicationStatus>([
  "rejected",
  "ghosted",
]);

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  sent: "Submitted",
  screen: "Screening",
  case: "Case Study",
  interview: "Interview",
  final: "Final Round",
  offer: "Offer",
  rejected: "Rejected",
  ghosted: "Ghosted",
};

const GENERIC_FOLLOW_UP_NEXT_ACTIONS = new Set([
  "send follow-up in 5 days",
  "follow up in 5 days",
]);

export function normalizeApplicationNextActionForStatus(
  nextAction: string | undefined,
  status: ApplicationStatus
): string {
  const value = nextAction ?? "";
  if (
    status === "rejected" &&
    GENERIC_FOLLOW_UP_NEXT_ACTIONS.has(value.trim().toLowerCase())
  ) {
    return "";
  }

  return value;
}

export function getApplicationVisibleNextAction(application: JobOsApplication): string {
  return normalizeApplicationNextActionForStatus(
    application.nextAction,
    application.status
  );
}

export function applicationReachedInterview(application: JobOsApplication): boolean {
  return (
    Boolean(application.interviewStageReached) ||
    INTERVIEW_RELATED_APPLICATION_STATUSES.has(application.status)
  );
}

export function applicationHasActiveInterview(application: JobOsApplication): boolean {
  return (
    INTERVIEW_RELATED_APPLICATION_STATUSES.has(application.status) &&
    !CLOSED_APPLICATION_STATUSES.has(application.status)
  );
}

export function getApplicationInterviewMetrics(applications: JobOsApplication[]): {
  interviewCount: number;
  activeInterviewCount: number;
} {
  return {
    interviewCount: applications.filter(applicationReachedInterview).length,
    activeInterviewCount: applications.filter(applicationHasActiveInterview).length,
  };
}

export function sortJobOsApplications(
  applications: JobOsApplication[],
  companiesById: Map<string, JobOsCompany>,
  rolesById: Map<string, JobOsRole>,
  sortField: ApplicationSortField,
  sortDirection: SortDirection
): JobOsApplication[] {
  return [...applications].sort((left, right) => {
    const leftCompany = companiesById.get(left.companyId)?.name ?? "";
    const rightCompany = companiesById.get(right.companyId)?.name ?? "";
    const leftRole = rolesById.get(left.roleId)?.title ?? "";
    const rightRole = rolesById.get(right.roleId)?.title ?? "";

    const comparison = (() => {
      switch (sortField) {
        case "company":
          return leftCompany.localeCompare(rightCompany);
        case "role":
          return leftRole.localeCompare(rightRole);
        case "status":
          return APPLICATION_STATUS_LABELS[left.status].localeCompare(
            APPLICATION_STATUS_LABELS[right.status]
          );
        case "nextAction":
          return getApplicationVisibleNextAction(left).localeCompare(
            getApplicationVisibleNextAction(right)
          );
        case "channel":
          return (left.channel || "").localeCompare(right.channel || "");
        case "notes":
          return (left.notes || "").localeCompare(right.notes || "");
        case "date":
        default:
          return left.dateApplied.localeCompare(right.dateApplied);
      }
    })();

    return sortDirection === "asc" ? comparison : -comparison;
  });
}

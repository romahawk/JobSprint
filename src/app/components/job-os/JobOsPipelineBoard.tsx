import { CalendarDays, FileText, MessageSquare, MoveRight } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  APPLICATION_STATUS_LABELS,
  applicationReachedInterview,
  getApplicationVisibleNextAction,
} from "../../services/jobOsApplications";
import type { ApplicationStatus, JobOsApplication, JobOsCompany, JobOsRole } from "../../types/jobOs";

export { APPLICATION_STATUS_LABELS };

export const APPLICATION_STAGE_GROUPS = {
  active: {
    label: "Active",
    description: "Fresh submissions and live early-stage progress.",
    statuses: ["sent", "screen", "case"] as ApplicationStatus[],
  },
  interviewing: {
    label: "Interviewing",
    description: "Processes that need tighter follow-through.",
    statuses: ["interview", "final", "offer"] as ApplicationStatus[],
  },
  closed: {
    label: "Closed",
    description: "Finished outcomes kept for reference and cleanup.",
    statuses: ["rejected", "ghosted"] as ApplicationStatus[],
  },
} as const;

type ApplicationStageGroup = keyof typeof APPLICATION_STAGE_GROUPS;

interface JobOsPipelineBoardProps {
  applications: JobOsApplication[];
  companiesById: Map<string, JobOsCompany>;
  rolesById: Map<string, JobOsRole>;
  group: ApplicationStageGroup;
  onSelectApplication: (application: JobOsApplication) => void;
}

function JobOsPipelineCard({
  application,
  companyName,
  roleTitle,
  onClick,
}: {
  application: JobOsApplication;
  companyName: string;
  roleTitle: string;
  onClick: () => void;
}) {
  const visibleNextAction = getApplicationVisibleNextAction(application);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">
            {companyName}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {roleTitle}
          </div>
        </div>
        <MoveRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" />
          {new Date(application.dateApplied).toLocaleDateString()}
        </span>
        {application.tailoredCvUpdatedAt ? (
          <Badge variant="outline" className="rounded-full text-[10px]">
            CV tailored
          </Badge>
        ) : null}
        {applicationReachedInterview(application) ? (
          <Badge variant="secondary" className="gap-1 rounded-full text-[10px]">
            <MessageSquare className="h-3 w-3" />
            Interviewed
          </Badge>
        ) : null}
        {visibleNextAction ? (
          <Badge variant="outline" className="rounded-full text-[10px]">
            {visibleNextAction}
          </Badge>
        ) : null}
        {application.notes ? <FileText className="h-3.5 w-3.5" /> : null}
      </div>
    </button>
  );
}

export function JobOsPipelineBoard({
  applications,
  companiesById,
  rolesById,
  group,
  onSelectApplication,
}: JobOsPipelineBoardProps) {
  const visibleStatuses = APPLICATION_STAGE_GROUPS[group].statuses;

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
      {visibleStatuses.map((status) => {
        const stageApplications = applications.filter((application) => application.status === status);
        return (
          <section
            key={status}
            className="flex min-w-0 flex-col rounded-2xl border border-border/70 bg-background/70 p-3 dark:bg-background/30"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {APPLICATION_STATUS_LABELS[status]}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {stageApplications.length} application{stageApplications.length === 1 ? "" : "s"}
                </p>
              </div>
              <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px]">
                {stageApplications.length}
              </Badge>
            </div>

            <div className="space-y-2 rounded-xl border border-dashed border-border/60 bg-background/60 p-2 lg:max-h-[calc(100vh-24rem)] lg:overflow-y-auto">
              {stageApplications.length > 0 ? (
                stageApplications.map((application) => (
                  <JobOsPipelineCard
                    key={application.id}
                    application={application}
                    companyName={companiesById.get(application.companyId)?.name ?? "Unknown company"}
                    roleTitle={rolesById.get(application.roleId)?.title ?? "Unknown role"}
                    onClick={() => onSelectApplication(application)}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
                  No applications in this stage.
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

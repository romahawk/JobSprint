import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useMemo, useState } from "react";
import { KanbanSquare, List, MoveRight } from "lucide-react";
import type { Application, PipelineStatus } from "../types";
import { PipelineColumn } from "./PipelineColumn";
import { STATUS_LABELS, STATUS_ORDER } from "../utils";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";

interface PipelineBoardProps {
  applications: Application[];
  onUpdateStatus: (id: string, status: PipelineStatus) => void;
  onCardClick: (app: Application) => void;
}

type StageGroup = "active" | "interviewing" | "closed";
type ViewMode = "board" | "list";

const STAGE_GROUPS: Record<StageGroup, PipelineStatus[]> = {
  active: ["targeted", "applied", "hr_screen"],
  interviewing: ["interview", "final_round", "offer"],
  closed: ["rejected"],
};

const STAGE_GROUP_META: Record<
  StageGroup,
  { label: string; description: string }
> = {
  active: {
    label: "Active",
    description: "Top-of-funnel work and current momentum.",
  },
  interviewing: {
    label: "Interviewing",
    description: "Live processes that need close tracking.",
  },
  closed: {
    label: "Closed",
    description: "Finished outcomes kept for reference.",
  },
};

function CompactStageList({
  statuses,
  applications,
  onCardClick,
}: {
  statuses: PipelineStatus[];
  applications: Application[];
  onCardClick: (app: Application) => void;
}) {
  return (
    <div className="space-y-4">
      {statuses.map((status) => {
        const stageApps = applications.filter((app) => app.status === status);
        return (
          <section key={status} className="rounded-xl border border-border/70 bg-background/70 dark:bg-background/30">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {STATUS_LABELS[status]}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {stageApps.length === 0 ? "No applications in this stage." : `${stageApps.length} application${stageApps.length === 1 ? "" : "s"}`}
                </p>
              </div>
              <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px]">
                {stageApps.length}
              </Badge>
            </div>
            {stageApps.length > 0 ? (
              <div className="divide-y divide-border/60">
                {stageApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => onCardClick(app)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {app.company}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {app.role}
                      </div>
                    </div>
                    <div className="hidden text-xs text-muted-foreground sm:block">
                      {new Date(app.dateApplied).toLocaleDateString()}
                    </div>
                    <Badge variant="outline" className="hidden rounded-full md:inline-flex">
                      {app.priority}
                    </Badge>
                    <MoveRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

export function PipelineBoard({
  applications,
  onUpdateStatus,
  onCardClick,
}: PipelineBoardProps) {
  const [stageGroup, setStageGroup] = useState<StageGroup>("active");
  const [viewMode, setViewMode] = useState<ViewMode>("board");

  const visibleStatuses = STAGE_GROUPS[stageGroup];
  const visibleApplications = useMemo(
    () => applications.filter((app) => visibleStatuses.includes(app.status)),
    [applications, visibleStatuses]
  );
  const totalVisible = visibleApplications.length;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Tabs value={stageGroup} onValueChange={(value) => setStageGroup(value as StageGroup)} className="gap-3">
              <TabsList className="h-auto w-full flex-wrap justify-start rounded-2xl bg-muted/70 p-1 sm:w-fit">
                {(Object.keys(STAGE_GROUPS) as StageGroup[]).map((group) => (
                  <TabsTrigger key={group} value={group} className="rounded-xl px-3 py-2 text-sm">
                    {STAGE_GROUP_META[group].label}
                    <Badge variant="outline" className="ml-1 rounded-full bg-background/70 px-1.5 py-0 text-[10px]">
                      {applications.filter((app) => STAGE_GROUPS[group].includes(app.status)).length}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <p className="text-sm text-muted-foreground">
              {STAGE_GROUP_META[stageGroup].description}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-xl border border-border/70 bg-background/70 p-1 dark:bg-background/30">
            <Button
              type="button"
              size="sm"
              variant={viewMode === "board" ? "default" : "ghost"}
              className="rounded-lg"
              onClick={() => setViewMode("board")}
            >
              <KanbanSquare className="h-4 w-4" />
              Board
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "list" ? "default" : "ghost"}
              className="rounded-lg"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
              Compact list
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            Showing {visibleStatuses.length} stage{visibleStatuses.length === 1 ? "" : "s"} and {totalVisible} application{totalVisible === 1 ? "" : "s"}.
          </span>
          <span className="hidden sm:inline">
            {viewMode === "board" ? "Drag cards between stages in this group." : "Use the compact list when you want faster scanning on laptop screens."}
          </span>
        </div>

        {viewMode === "board" ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {STATUS_ORDER.filter((status) => visibleStatuses.includes(status as PipelineStatus)).map((status) => (
              <PipelineColumn
                key={status}
                status={status as PipelineStatus}
                title={STATUS_LABELS[status]}
                applications={applications.filter((app) => app.status === status)}
                onUpdateStatus={onUpdateStatus}
                onCardClick={onCardClick}
              />
            ))}
          </div>
        ) : (
          <CompactStageList
            statuses={visibleStatuses}
            applications={visibleApplications}
            onCardClick={onCardClick}
          />
        )}
      </div>
    </DndProvider>
  );
}

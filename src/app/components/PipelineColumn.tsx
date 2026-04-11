import { useDrop } from "react-dnd";
import type { Application, PipelineStatus } from "../types";
import { ApplicationCard } from "./ApplicationCard";

interface PipelineColumnProps {
  status: PipelineStatus;
  title: string;
  applications: Application[];
  onUpdateStatus: (id: string, status: PipelineStatus) => void;
  onCardClick: (app: Application) => void;
}

export function PipelineColumn({
  status,
  title,
  applications,
  onUpdateStatus,
  onCardClick,
}: PipelineColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "application",
    drop: (item: { id: string }) => {
      onUpdateStatus(item.id, status);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-border/70 bg-black/[0.02] p-3 dark:bg-white/[0.02]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </span>
        <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground/70 tabular-nums">
          {applications.length}
        </span>
      </div>

      <div
        ref={drop}
        className={`min-h-[220px] flex-1 space-y-2 rounded-lg border border-dashed p-2 transition-colors lg:max-h-[calc(100vh-24rem)] lg:overflow-y-auto ${
          isOver
            ? "border-[#124BE6]/40 bg-[#124BE6]/5 dark:bg-[#124BE6]/10"
            : "border-border/60 bg-background/70 dark:bg-background/30"
        }`}
      >
        {applications.map((app) => (
          <ApplicationCard
            key={app.id}
            application={app}
            onUpdateStatus={onUpdateStatus}
            onClick={() => onCardClick(app)}
          />
        ))}
      </div>
    </div>
  );
}

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
    <div className="flex min-w-0 flex-col">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <span className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </span>
        <span className="shrink-0 text-[10px] font-semibold text-muted-foreground/60 tabular-nums">
          {applications.length}
        </span>
      </div>

      <div
        ref={drop}
        className={`min-h-[160px] flex-1 space-y-2 rounded-lg p-2 transition-colors ${
          isOver
            ? "bg-[#124BE6]/5 dark:bg-[#124BE6]/10"
            : "bg-black/[0.03] dark:bg-white/[0.03]"
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

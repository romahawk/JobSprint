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
    <div className="flex flex-col min-w-[280px] flex-shrink-0">
      <div className="mb-3 px-2">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
          {title}
        </h3>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {applications.length}
        </span>
      </div>

      <div
        ref={drop}
        className={`flex-1 space-y-2 min-h-[200px] rounded-lg p-2 transition-colors ${
          isOver
            ? "bg-neutral-100 dark:bg-neutral-800"
            : "bg-neutral-50 dark:bg-neutral-900/50"
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

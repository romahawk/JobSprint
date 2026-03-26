import { useDrag } from "react-dnd";
import { StickyNote, ExternalLink } from "lucide-react";
import type { Application, PipelineStatus } from "../types";

const PRIORITY_COLORS = {
  high: "border-l-[#E6AA12]",
  medium: "border-l-[#124BE6]",
  backup: "border-l-[#91783C]",
};

interface ApplicationCardProps {
  application: Application;
  onUpdateStatus: (id: string, status: PipelineStatus) => void;
  onClick: () => void;
}

export function ApplicationCard({
  application,
  onUpdateStatus: _onUpdateStatus,
  onClick,
}: ApplicationCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "application",
    item: { id: application.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      onClick={onClick}
      className={`cursor-pointer rounded-xl border border-border border-l-4 bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-md ${
        PRIORITY_COLORS[application.priority]
      } ${isDragging ? "opacity-40 scale-95" : "opacity-100"}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="truncate text-[13px] font-semibold leading-tight text-neutral-900 dark:text-neutral-100">
            {application.company}
          </h4>
          <p className="truncate text-[11px] leading-tight text-neutral-500 dark:text-neutral-400">
            {application.role}
          </p>
        </div>
        {application.jobLink && (
          <a
            href={application.jobLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 text-[10px] text-neutral-500 dark:text-neutral-400">
        <span className="truncate">{new Date(application.dateApplied).toLocaleDateString()}</span>
        {application.notes && <StickyNote className="h-3 w-3 shrink-0" />}
      </div>

      {application.salary && (
        <div className="mt-2 truncate text-[10px] text-neutral-600 dark:text-neutral-300">
          {application.salary}
        </div>
      )}
    </div>
  );
}

import { useDrag } from "react-dnd";
import { StickyNote, ExternalLink } from "lucide-react";
import type { Application, PipelineStatus } from "../types";

const PRIORITY_COLORS = {
  high: "border-l-red-500",
  medium: "border-l-blue-500",
  backup: "border-l-neutral-400",
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
      className={`border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 bg-white dark:bg-neutral-900 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors border-l-4 ${
        PRIORITY_COLORS[application.priority]
      } ${isDragging ? "opacity-50" : "opacity-100"}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">
            {application.company}
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
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
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>{new Date(application.dateApplied).toLocaleDateString()}</span>
        {application.notes && <StickyNote className="w-3 h-3" />}
      </div>

      {application.salary && (
        <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">
          {application.salary}
        </div>
      )}
    </div>
  );
}

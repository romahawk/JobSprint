import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import type { NextAction, ActionPriority } from "../../services/execution/nextActionEngine";

const PRIORITY_STYLES: Record<ActionPriority, string> = {
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

const TYPE_COLORS: Record<NextAction["type"], string> = {
  apply: "border-l-blue-500",
  log_application: "border-l-cyan-500",
  follow_up: "border-l-purple-500",
  optimize_cv: "border-l-green-500",
  add_role: "border-l-teal-500",
  research: "border-l-indigo-500",
  archive: "border-l-neutral-400",
};

interface NextActionCardProps {
  action: NextAction;
  rank: number;
}

export function NextActionCard({ action, rank }: NextActionCardProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border border-neutral-200 dark:border-neutral-800 border-l-4 ${TYPE_COLORS[action.type]} bg-white dark:bg-neutral-900 p-3 shadow-sm`}
    >
      {/* Rank */}
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
        {rank}
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {action.companyName && (
            <span className="text-sm font-semibold truncate text-neutral-900 dark:text-neutral-100">
              {action.companyName}
            </span>
          )}
          {action.roleTitle && (
            <span className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
              — {action.roleTitle}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
          {action.reason}
        </p>
      </div>

      {/* Right side */}
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[action.priority]}`}
        >
          {action.priority}
        </span>
        <Link
          to={action.href}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {action.actionLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

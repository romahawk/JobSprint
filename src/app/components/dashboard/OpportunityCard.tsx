import { ArrowRight, Star } from "lucide-react";
import { Link } from "react-router";
import type { HotOpportunity } from "../../services/execution/nextActionEngine";
import type { CompanyPriority } from "../../types/jobOs";

const PRIORITY_BADGE: Record<CompanyPriority, string> = {
  A: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  B: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  C: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

interface OpportunityCardProps {
  opportunity: HotOpportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 shadow-sm">
      {/* Fit stars */}
      <div className="flex shrink-0 flex-col items-center gap-0.5 pt-0.5">
        <Star
          className={`h-4 w-4 ${
            opportunity.fitScore >= 4
              ? "fill-yellow-400 text-yellow-400"
              : "text-neutral-300 dark:text-neutral-600"
          }`}
        />
        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          {opportunity.fitScore}/5
        </span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
            {opportunity.companyName}
          </span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${PRIORITY_BADGE[opportunity.priority]}`}
          >
            {opportunity.priority}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 truncate">
          {opportunity.roleTitle}
        </p>
        {opportunity.reason && (
          <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500 line-clamp-1">
            {opportunity.reason}
          </p>
        )}
      </div>

      <Link
        to={opportunity.href}
        className="shrink-0 flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-0.5"
      >
        Apply
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

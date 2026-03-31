import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Zap } from "lucide-react";
import { useJobOsContext } from "../../context/JobOsContext";
import { getNextActions } from "../../services/execution/nextActionEngine";
import type { NextAction, ActionPriority } from "../../services/execution/nextActionEngine";

const PRIORITY_DOT: Record<ActionPriority, string> = {
  urgent: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-blue-500",
  low: "bg-neutral-400",
};

function ActionItem({
  action,
  onDismiss,
}: {
  action: NextAction;
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[action.priority]}`}
        title={action.priority}
      />
      <div className="min-w-0 flex-1">
        <span className="truncate text-xs font-medium text-neutral-900 dark:text-neutral-100">
          {action.companyName ? `${action.companyName} · ` : ""}
        </span>
        <span className="truncate text-xs text-neutral-600 dark:text-neutral-400">
          {action.reason}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Link
          to={action.href}
          className="inline-flex items-center gap-1 rounded-md bg-neutral-900 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-100 dark:text-black dark:hover:bg-neutral-300"
        >
          {action.actionLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
        <button
          onClick={() => onDismiss(action.id)}
          aria-label="Dismiss"
          className="rounded p-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function CommandCenter() {
  const { companies, roles, applications, outreach, loading } = useJobOsContext();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const allActions = useMemo(
    () =>
      loading
        ? []
        : getNextActions({ companies, roles, applications, outreach }, 8),
    [companies, roles, applications, outreach, loading]
  );

  const visibleActions = useMemo(
    () => allActions.filter((a) => !dismissed.has(a.id)).slice(0, 3),
    [allActions, dismissed]
  );

  function dismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
  }

  if (loading || visibleActions.length === 0) return null;

  return (
    <div className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50">
      <div className="max-w-[1800px] mx-auto px-6 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Next actions
          </div>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap">
            {visibleActions.map((action) => (
              <div key={action.id} className="sm:min-w-0 sm:flex-1">
                <ActionItem action={action} onDismiss={dismiss} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

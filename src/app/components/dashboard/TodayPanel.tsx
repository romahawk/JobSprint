import { Zap } from "lucide-react";
import type { NextAction } from "../../services/execution/nextActionEngine";
import { NextActionCard } from "./NextActionCard";

interface TodayPanelProps {
  actions: NextAction[];
  isLoading?: boolean;
}

export function TodayPanel({ actions, isLoading }: TodayPanelProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-yellow-500" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
          Today's Actions
        </h2>
        {actions.length > 0 && (
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {actions.length}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800"
            />
          ))}
        </div>
      )}

      {!isLoading && actions.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-200 dark:border-neutral-800 p-6 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No urgent actions right now. Keep the pipeline moving!
          </p>
        </div>
      )}

      {!isLoading && actions.length > 0 && (
        <div className="space-y-2">
          {actions.map((action, i) => (
            <NextActionCard key={action.id} action={action} rank={i + 1} />
          ))}
        </div>
      )}
    </section>
  );
}

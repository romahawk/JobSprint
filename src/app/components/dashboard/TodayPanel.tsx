import { Zap } from "lucide-react";
import type { NextAction } from "../../services/execution/nextActionEngine";
import { NextActionCard } from "./NextActionCard";

interface TodayPanelProps {
  actions: NextAction[];
  isLoading?: boolean;
}

export function TodayPanel({ actions, isLoading }: TodayPanelProps) {
  const queuedActions = actions.slice(1);

  return (
    <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-yellow-500" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
          Today's Queue
        </h2>
        {queuedActions.length > 0 && (
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {queuedActions.length}
          </span>
        )}
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Everything after the hero stays here in ranked order so you can keep moving without re-planning.
      </p>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800"
            />
          ))}
        </div>
      )}

      {!isLoading && queuedActions.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-200 dark:border-neutral-800 p-4 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            The hero action is your only priority right now. Finish it, or add more pipeline data if you want the queue to refill.
          </p>
        </div>
      )}

      {!isLoading && queuedActions.length > 0 && (
        <div className="space-y-2 lg:max-h-[calc(100vh-25rem)] lg:overflow-y-auto lg:pr-1">
          {queuedActions.map((action, i) => (
            <NextActionCard key={action.id} action={action} rank={i + 2} compact />
          ))}
        </div>
      )}
    </section>
  );
}

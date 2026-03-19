import { BarChart2 } from "lucide-react";
import type { PipelineStats as PipelineStatsData } from "../../services/execution/nextActionEngine";

interface StatTileProps {
  label: string;
  value: number | string;
  highlight?: boolean;
}

function StatTile({ label, value, highlight }: StatTileProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 shadow-sm text-center">
      <span
        className={`text-2xl font-bold tabular-nums ${
          highlight
            ? "text-primary"
            : "text-neutral-900 dark:text-neutral-100"
        }`}
      >
        {value}
      </span>
      <span className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
    </div>
  );
}

interface PipelineStatsProps {
  stats: PipelineStatsData;
  isLoading?: boolean;
}

export function PipelineStats({ stats, isLoading }: PipelineStatsProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-blue-500" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
          Pipeline Snapshot
        </h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatTile label="To Apply" value={stats.toApply} />
          <StatTile label="Applied" value={stats.applied} />
          <StatTile label="Interviewing" value={stats.interviewing} highlight />
          <StatTile label="Offers" value={stats.offers} highlight={stats.offers > 0} />
        </div>
      )}

      {!isLoading && stats.applied > 0 && (
        <p className="text-xs text-center text-neutral-400 dark:text-neutral-500">
          Interview conversion rate:{" "}
          <span className="font-medium text-neutral-600 dark:text-neutral-300">
            {stats.conversionRate}%
          </span>
        </p>
      )}
    </section>
  );
}

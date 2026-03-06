import { Activity, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useApp } from "../context";
import { getActivitySignal } from "../utils";

export function ActivitySignalCard() {
  const { applications } = useApp();
  const signal = getActivitySignal(applications);

  const trendLabel =
    signal.direction === "up"
      ? "Up"
      : signal.direction === "down"
      ? "Down"
      : "Flat";

  const TrendIcon =
    signal.direction === "up"
      ? TrendingUp
      : signal.direction === "down"
      ? TrendingDown
      : Minus;

  const trendColor =
    signal.direction === "up"
      ? "text-green-600 dark:text-green-400"
      : signal.direction === "down"
      ? "text-red-600 dark:text-red-400"
      : "text-neutral-500 dark:text-neutral-400";

  return (
    <div className="border border-blue-200 dark:border-blue-900/50 rounded-lg p-6 bg-blue-50 dark:bg-blue-950/30">
      <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase tracking-wide mb-6">
        7-Day Activity
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              Applications in last 7 days
            </div>
            <div className="text-4xl font-semibold text-neutral-900 dark:text-neutral-100">
              {signal.currentCount}
            </div>
          </div>
          <Activity className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
        </div>

        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <div className={`flex items-center gap-2 text-sm font-medium ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span>
              {trendLabel} by {Math.abs(signal.delta)} vs previous 7 days
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            {signal.percentChange.toFixed(1)}% change from prior period (
            {signal.previousCount} applications).
          </p>
        </div>
      </div>
    </div>
  );
}

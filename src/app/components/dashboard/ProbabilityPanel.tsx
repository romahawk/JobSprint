import { useState } from "react";
import { TrendingUp, ChevronDown } from "lucide-react";
import { calculateProbabilityScenarios } from "../../utils";
import { Progress } from "../ui/progress";
import type { PipelineStats } from "../../services/execution/nextActionEngine";

interface ProbabilityPanelProps {
  stats: PipelineStats;
  isLoading?: boolean;
}

export function ProbabilityPanel({ stats, isLoading }: ProbabilityPanelProps) {
  const [open, setOpen] = useState(false);

  const scenarios = calculateProbabilityScenarios(
    stats.applied,
    stats.responseRate,
    stats.interviewRate,
    stats.offerRate,
  );

  return (
    <section className="space-y-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 py-1 group"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
            Probability Engine
          </h2>
          {!open && stats.applied > 0 && !isLoading && (
            <span className="text-xs font-medium text-green-600 dark:text-green-400 tabular-nums">
              {scenarios.probabilityOfOffer.toFixed(1)}%
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="pt-3">
          <div className="rounded-lg border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30 p-4 space-y-4">
            {isLoading ? (
              <div className="h-20 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
            ) : stats.applied === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Log applications to see offer probability.
              </p>
            ) : (
              <>
                <div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                    Probability of ≥1 Offer
                  </div>
                  <div className="text-3xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100 mb-2">
                    {scenarios.probabilityOfOffer.toFixed(1)}%
                  </div>
                  <Progress value={scenarios.probabilityOfOffer} className="h-2" />
                </div>

                <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3 space-y-3">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    Scenarios
                  </div>
                  {(
                    [
                      { label: "Conservative", data: scenarios.conservative, color: "text-orange-500" },
                      { label: "Realistic", data: scenarios.realistic, color: "text-blue-500" },
                      { label: "Strong", data: scenarios.strong, color: "text-green-500" },
                    ] as const
                  ).map(({ label, data, color }) => (
                    <div key={label}>
                      <div className={`text-xs font-medium mb-1 ${color}`}>{label}</div>
                      <div className="grid grid-cols-3 gap-1 text-xs">
                        <div>
                          <div className="text-neutral-500 dark:text-neutral-400">Response</div>
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">
                            {data.response.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-neutral-500 dark:text-neutral-400">Interview</div>
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">
                            {data.interview.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-neutral-500 dark:text-neutral-400">Offer</div>
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">
                            {data.offer.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Based on: {stats.applied} applications · {stats.responseRate}% response · {stats.interviewRate}% interview · {stats.offerRate}% offer
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

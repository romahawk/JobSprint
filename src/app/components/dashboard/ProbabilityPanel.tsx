import { useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { calculateProbabilityScenarios } from "../../utils";
import type { PipelineStats } from "../../services/execution/nextActionEngine";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Progress } from "../ui/progress";

interface ProbabilityPanelProps {
  stats: PipelineStats;
  isLoading?: boolean;
}

export function ProbabilityPanel({ stats, isLoading }: ProbabilityPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const scenarios = calculateProbabilityScenarios(
    stats.applied,
    stats.responseRate,
    stats.interviewRate,
    stats.offerRate,
  );

  return (
    <section className="space-y-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-left transition-colors hover:bg-green-100 dark:border-green-900/50 dark:bg-green-950/30 dark:hover:bg-green-950/40">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              Probability Engine
            </h2>
            <span className="ml-auto text-neutral-500 dark:text-neutral-400">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3 space-y-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/30">
          {isLoading ? (
            <div className="h-20 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
          ) : stats.applied === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Log applications to see offer probability.
            </p>
          ) : (
            <>
              <div>
                <div className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Probability of at least 1 offer
                </div>
                <div className="mb-2 text-3xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {scenarios.probabilityOfOffer.toFixed(1)}%
                </div>
                <Progress value={scenarios.probabilityOfOffer} className="h-2" />
              </div>

              <div className="space-y-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
                <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
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
                    <div className={`mb-1 text-xs font-medium ${color}`}>{label}</div>
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

              <div className="border-t border-neutral-200 pt-3 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Based on: {stats.applied} applications, {stats.responseRate}% response, {stats.interviewRate}% interview, {stats.offerRate}% offer
                </p>
              </div>
            </>
          )}
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}

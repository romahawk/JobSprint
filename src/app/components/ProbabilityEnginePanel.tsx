import { useApp } from "../context";
import { calculateMetrics, calculateProbabilityScenarios } from "../utils";
import { Progress } from "./ui/progress";

export function ProbabilityEnginePanel() {
  const { applications } = useApp();
  const metrics = calculateMetrics(applications);

  const scenarios = calculateProbabilityScenarios(
    metrics.appliedCount,
    metrics.responseRate,
    metrics.interviewRate,
    metrics.offerRate
  );

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 bg-white dark:bg-neutral-900">
      <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase tracking-wide mb-6">
        Probability Engine
      </h3>

      <div className="space-y-6">
        {/* Expected Offers */}
        <div>
          <div className="mb-4">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              Probability of ≥1 Offer
            </div>
            <div className="text-4xl font-semibold text-neutral-900 dark:text-neutral-100">
              {scenarios.probabilityOfOffer.toFixed(1)}%
            </div>
          </div>
          <Progress value={scenarios.probabilityOfOffer} className="h-3" />
        </div>

        {/* Scenarios */}
        <div className="space-y-4 border-t border-neutral-200 dark:border-neutral-800 pt-6">
          <h4 className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">
            Scenarios
          </h4>

          <ScenarioRow
            label="Conservative"
            response={scenarios.conservative.response}
            interview={scenarios.conservative.interview}
            offer={scenarios.conservative.offer}
            color="text-orange-500"
          />

          <ScenarioRow
            label="Realistic"
            response={scenarios.realistic.response}
            interview={scenarios.realistic.interview}
            offer={scenarios.realistic.offer}
            color="text-blue-500"
          />

          <ScenarioRow
            label="Strong"
            response={scenarios.strong.response}
            interview={scenarios.strong.interview}
            offer={scenarios.strong.offer}
            color="text-green-500"
          />
        </div>

        {/* Formula Info */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Based on: Applications × Response Rate × Interview Rate × Offer Rate
          </p>
        </div>
      </div>
    </div>
  );
}

interface ScenarioRowProps {
  label: string;
  response: number;
  interview: number;
  offer: number;
  color: string;
}

function ScenarioRow({ label, response, interview, offer, color }: ScenarioRowProps) {
  return (
    <div>
      <div className={`text-xs font-medium mb-2 ${color}`}>{label}</div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-neutral-500 dark:text-neutral-400">Response</div>
          <div className="font-medium text-neutral-900 dark:text-neutral-100">
            {response.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-neutral-500 dark:text-neutral-400">Interview</div>
          <div className="font-medium text-neutral-900 dark:text-neutral-100">
            {interview.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-neutral-500 dark:text-neutral-400">Offer</div>
          <div className="font-medium text-neutral-900 dark:text-neutral-100">
            {offer.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}

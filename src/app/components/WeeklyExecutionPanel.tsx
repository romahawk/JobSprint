import { useApp } from "../context";
import { Progress } from "./ui/progress";
import { Checkbox } from "./ui/checkbox";
import { getThisWeekApplications, calculateMetrics } from "../utils";

export function WeeklyExecutionPanel() {
  const { applications, weeklyGoals, toggleChecklistItem } = useApp();

  const thisWeekApps = getThisWeekApplications(applications);
  const metrics = calculateMetrics(thisWeekApps);

  const progressPercentage = (thisWeekApps.length / weeklyGoals.target) * 100;

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 bg-white dark:bg-neutral-900">
      <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase tracking-wide mb-6">
        Weekly Execution
      </h3>

      <div className="space-y-6">
        {/* Weekly Target */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Weekly Target
            </span>
            <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {thisWeekApps.length} / {weeklyGoals.target}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* This Week Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">
              Response Rate
            </span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {metrics.responseRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">
              Interview Rate
            </span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {metrics.interviewRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Checklist */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
          <h4 className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-4">
            Weekly Checklist
          </h4>
          <div className="space-y-3">
            {weeklyGoals.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <Checkbox
                  id={item.id}
                  checked={item.completed}
                  onCheckedChange={() => toggleChecklistItem(item.id)}
                />
                <label
                  htmlFor={item.id}
                  className={`text-sm cursor-pointer ${
                    item.completed
                      ? "line-through text-neutral-400 dark:text-neutral-500"
                      : "text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {item.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

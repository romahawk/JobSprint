import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { useApp } from "../context";
import { Progress } from "./ui/progress";
import { Checkbox } from "./ui/checkbox";
import { getThisWeekApplications, calculateMetrics } from "../utils";

export function WeeklyExecutionPanel() {
  const {
    applications,
    weeklyGoals,
    toggleChecklistItem,
    updateWeeklyGoals,
    addChecklistItem,
    removeChecklistItem,
  } = useApp();

  const [editingTarget, setEditingTarget] = useState(false);
  const [targetDraft, setTargetDraft] = useState(String(weeklyGoals.target));
  const [newItemDraft, setNewItemDraft] = useState("");
  const newItemRef = useRef<HTMLInputElement>(null);

  const thisWeekApps = getThisWeekApplications(applications);
  const metrics = calculateMetrics(thisWeekApps);
  const progressPercentage = Math.min(
    (thisWeekApps.length / Math.max(weeklyGoals.target, 1)) * 100,
    100
  );

  function commitTarget() {
    const parsed = parseInt(targetDraft, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      updateWeeklyGoals({ target: parsed });
    } else {
      setTargetDraft(String(weeklyGoals.target));
    }
    setEditingTarget(false);
  }

  function handleAddItem() {
    if (!newItemDraft.trim()) return;
    addChecklistItem(newItemDraft);
    setNewItemDraft("");
    newItemRef.current?.focus();
  }

  return (
    <div className="border border-orange-200 dark:border-orange-900/50 rounded-lg p-6 bg-orange-50 dark:bg-orange-950/30">
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
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {thisWeekApps.length} /
              </span>
              {editingTarget ? (
                <input
                  type="number"
                  min={1}
                  className="w-14 text-2xl font-semibold text-neutral-900 dark:text-neutral-100 bg-transparent border-b border-orange-400 outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={targetDraft}
                  onChange={(e) => setTargetDraft(e.target.value)}
                  onBlur={commitTarget}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitTarget();
                    if (e.key === "Escape") {
                      setTargetDraft(String(weeklyGoals.target));
                      setEditingTarget(false);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTargetDraft(String(weeklyGoals.target));
                    setEditingTarget(true);
                  }}
                  title="Click to edit weekly target"
                  className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 hover:text-orange-600 dark:hover:text-orange-400 transition-colors underline decoration-dotted underline-offset-2"
                >
                  {weeklyGoals.target}
                </button>
              )}
            </div>
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
              <div key={item.id} className="flex items-center gap-3 group">
                <Checkbox
                  id={item.id}
                  checked={item.completed}
                  onCheckedChange={() => toggleChecklistItem(item.id)}
                />
                <label
                  htmlFor={item.id}
                  className={`flex-1 text-sm cursor-pointer ${
                    item.completed
                      ? "line-through text-neutral-400 dark:text-neutral-500"
                      : "text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {item.label}
                </label>
                <button
                  type="button"
                  onClick={() => removeChecklistItem(item.id)}
                  aria-label={`Remove ${item.label}`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-red-500 dark:hover:text-red-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add item */}
          <div className="flex items-center gap-2 mt-4">
            <input
              ref={newItemRef}
              type="text"
              value={newItemDraft}
              onChange={(e) => setNewItemDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddItem();
              }}
              placeholder="Add checklist item…"
              className="flex-1 text-sm bg-transparent border-b border-neutral-300 dark:border-neutral-700 outline-none pb-0.5 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 text-neutral-700 dark:text-neutral-300"
            />
            <button
              type="button"
              onClick={handleAddItem}
              disabled={!newItemDraft.trim()}
              aria-label="Add item"
              className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 disabled:opacity-30 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

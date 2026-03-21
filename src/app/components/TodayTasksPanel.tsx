import React from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import type { NextActionTask, TaskPriority, ActionType } from "../types";

interface Props {
  tasks: NextActionTask[];
  onToggle: (id: string) => void;
  onDismiss: (id: string) => void;
}

const ACTION_LABELS: Record<ActionType, string> = {
  apply: "Apply",
  cv_tailor: "Tailor CV",
  outreach: "Outreach",
  follow_up: "Follow Up",
  research: "Research",
};

const PRIORITY_ORDER: TaskPriority[] = ["urgent", "high", "normal", "low"];

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

function isDueToday(task: NextActionTask): boolean {
  if (!task.dueDate) return false;
  const today = new Date().toISOString().split("T")[0];
  return task.dueDate === today;
}

function isOverdue(task: NextActionTask): boolean {
  if (!task.dueDate) return false;
  const today = new Date().toISOString().split("T")[0];
  return task.dueDate < today;
}

export function TodayTasksPanel({ tasks, onToggle, onDismiss }: Props) {
  const open = tasks.filter((t) => t.status === "open");

  if (open.length === 0) {
    return (
      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-foreground">Today's actions</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No actions for today.</p>
        </CardContent>
      </Card>
    );
  }

  const grouped = PRIORITY_ORDER.reduce<Record<TaskPriority, NextActionTask[]>>(
    (acc, p) => {
      acc[p] = open.filter((t) => t.priority === p);
      return acc;
    },
    { urgent: [], high: [], normal: [], low: [] }
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-sm font-semibold text-foreground">
          Today's actions{" "}
          <span className="text-muted-foreground font-normal">({open.length})</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {PRIORITY_ORDER.filter((p) => grouped[p].length > 0).map((priority) => (
          <div key={priority}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              {PRIORITY_LABELS[priority]}
            </p>
            <ul className="space-y-1.5">
              {grouped[priority].map((task) => {
                const overdue = isOverdue(task);
                const dueToday = isDueToday(task);
                return (
                  <li
                    key={task.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50 transition-colors group"
                  >
                    <input
                      type="checkbox"
                      checked={task.status === "done"}
                      onChange={() => onToggle(task.id)}
                      className="shrink-0 accent-primary"
                      aria-label={`Mark ${ACTION_LABELS[task.action]} as done`}
                    />
                    <span
                      className={`flex-1 text-sm ${
                        task.status === "done"
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {ACTION_LABELS[task.action]}
                    </span>
                    {overdue && (
                      <Badge className="text-xs bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30">
                        Overdue
                      </Badge>
                    )}
                    {dueToday && !overdue && (
                      <Badge className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
                        Due today
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                      onClick={() => onDismiss(task.id)}
                      aria-label="Dismiss task"
                    >
                      ×
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

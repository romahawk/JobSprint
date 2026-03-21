import React from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import type { Application, NextActionTask, OpportunityScore, ActionType } from "../types";
import { buildActionSummary } from "../services/nextBestActionEngine";

interface Props {
  application: Application;
  score: OpportunityScore;
  tasks: NextActionTask[];
}

const ACTION_LABELS: Record<ActionType, string> = {
  apply: "Apply",
  cv_tailor: "Tailor CV",
  outreach: "Outreach",
  follow_up: "Follow Up",
  research: "Research",
};

function ScoreRing({ score }: { score: number }) {
  const colour =
    score >= 60
      ? "text-emerald-500"
      : score >= 40
      ? "text-amber-500"
      : "text-red-500";

  return (
    <div className={`text-2xl font-bold tabular-nums ${colour}`}>
      {score}
      <span className="text-xs font-normal text-muted-foreground">/100</span>
    </div>
  );
}

export function NextBestActionCard({ application, score, tasks }: Props) {
  const summary = buildActionSummary(application, score, tasks);
  const openTasks = tasks
    .filter((t) => t.applicationId === application.id && t.status === "open")
    .slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Next best action
            </p>
            <p className="font-semibold text-foreground truncate">{summary.headline}</p>
            <p className="text-sm text-muted-foreground mt-1">{summary.subtext}</p>
          </div>
          <ScoreRing score={score.total} />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {openTasks.length > 0 ? (
          <ul className="space-y-1.5">
            {openTasks.map((task) => (
              <li key={task.id} className="flex items-center gap-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-foreground">{ACTION_LABELS[task.action]}</span>
                {task.dueDate && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    due {task.dueDate}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No open actions.</p>
        )}

        {summary.totalCount > 3 && (
          <p className="text-xs text-muted-foreground mt-2">
            +{summary.totalCount - 3} more actions
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mt-3">
          {score.total >= 60 && (
            <Badge className="text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              Strong match
            </Badge>
          )}
          {score.total >= 40 && score.total < 60 && (
            <Badge className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
              Moderate fit
            </Badge>
          )}
          {score.total < 40 && (
            <Badge className="text-xs bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30">
              Low signal
            </Badge>
          )}
          {application.referral && (
            <Badge variant="secondary" className="text-xs">
              Referral
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

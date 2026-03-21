import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import type { ImportResult } from "../services/jobImportOrchestrator";
import type { ActionType } from "../types";

interface Props {
  result: ImportResult;
  onConfirm: () => void;
  onDiscard: () => void;
}

const ACTION_LABELS: Record<ActionType, string> = {
  apply: "Apply",
  cv_tailor: "Tailor CV",
  outreach: "Outreach",
  follow_up: "Follow Up",
  research: "Research",
};

function ScoreBadge({ score }: { score: number }) {
  const label = `Score ${score}/100`;
  if (score >= 60) {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
        {label}
      </Badge>
    );
  }
  if (score >= 40) {
    return (
      <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
        {label}
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30">
      {label}
    </Badge>
  );
}

export function ImportedJobPreviewCard({ result, onConfirm, onDiscard }: Props) {
  const { applicationDraft, score, tasks, sourceLabel, confidence } = result;

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">
              {applicationDraft.company || "Unknown company"}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {applicationDraft.role || "Role not detected"} · {applicationDraft.location}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <ScoreBadge score={score.total} />
            <Badge variant="outline" className="text-xs">
              {sourceLabel}
            </Badge>
          </div>
        </div>

        {confidence < 0.4 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            Low confidence extraction — some fields may be incomplete. Review before adding.
          </p>
        )}
      </CardHeader>

      {tasks.length > 0 && (
        <CardContent className="pt-0">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Generated actions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tasks.map((t) => (
              <Badge key={t.action} variant="secondary" className="text-xs">
                {ACTION_LABELS[t.action]}
              </Badge>
            ))}
          </div>
        </CardContent>
      )}

      <CardFooter className="flex gap-2 pt-0">
        <Button onClick={onConfirm} className="flex-1">
          Add to pipeline
        </Button>
        <Button variant="ghost" onClick={onDiscard} className="text-muted-foreground">
          Discard
        </Button>
      </CardFooter>
    </Card>
  );
}

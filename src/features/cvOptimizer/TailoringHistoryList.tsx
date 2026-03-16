import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, CircleHelp, History } from "lucide-react";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../app/components/ui/tooltip";
import type { CvTailoringRun } from "../../app/types/jobOs";

interface TailoringHistoryListProps {
  runs: CvTailoringRun[];
  onReuse: (run: CvTailoringRun) => void;
}

const MODE_LABELS: Record<CvTailoringRun["mode"], string> = {
  analysis: "Analysis",
  quickTailor: "Quick Tailor",
  fullTailor: "Full Tailor",
};

function InlineInfoTip({ label }: { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:border-brand-blue/40 hover:text-foreground"
          aria-label={label}
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8} className="max-w-[260px] leading-5">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function TailoringHistoryList({ runs, onReuse }: TailoringHistoryListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleRuns = useMemo(() => runs.slice(0, 3), [runs]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm">Recent tailored runs</CardTitle>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Reuse previous tailored drafts</span>
              <InlineInfoTip label="Use this only to reopen a previous tailored draft. Analysis-only runs are intentionally excluded to avoid clutter." />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {isExpanded ? "Hide" : `Show ${visibleRuns.length}`}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          <History className="h-3.5 w-3.5" />
          <span>{runs.length > 0 ? `${runs.length} reusable tailored run${runs.length === 1 ? "" : "s"} saved for this context.` : "No tailored runs saved yet."}</span>
        </div>

        {isExpanded ? (
          visibleRuns.length > 0 ? (
            visibleRuns.map((run) => (
              <div key={run.id} className="rounded-xl border border-border bg-white/50 px-3 py-3 dark:bg-neutral-950/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">{MODE_LABELS[run.mode]}</div>
                    <div className="text-xs text-muted-foreground">{new Date(run.createdAt).toLocaleString()}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onReuse(run)}>
                    Reuse
                  </Button>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {(run.tailoredHeadline || run.recommendedPositioning || run.strengths[0] || "Saved tailored draft").slice(0, 140)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Saved quick-tailor or full-tailor runs will appear here.</p>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}

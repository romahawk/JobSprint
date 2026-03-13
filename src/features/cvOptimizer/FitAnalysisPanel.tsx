import { Badge } from "../../app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import type { FitAnalysisResult } from "../../services/cvOptimizerService";

interface FitAnalysisPanelProps {
  analysis: FitAnalysisResult | null;
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-white/70 p-4 dark:bg-neutral-950/50">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <Badge key={item} variant="outline" className="rounded-full px-3 py-1 text-xs">
              {item}
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No signals yet.</p>
        )}
      </div>
    </div>
  );
}

export function FitAnalysisPanel({ analysis }: FitAnalysisPanelProps) {
  return (
    <Card className="h-full border-brand-blue/15 bg-gradient-to-b from-white to-slate-50 dark:from-neutral-950 dark:to-neutral-900">
      <CardHeader>
        <CardTitle className="text-sm">Fit Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-brand-blue/20 bg-brand-blue px-4 py-4 text-white shadow-sm">
          <div className="text-xs uppercase tracking-[0.24em] text-white/70">Fit Score</div>
          <div className="mt-2 text-4xl font-semibold">{analysis?.fitScore ?? 0}%</div>
          <div className="mt-2 text-sm text-white/80">
            {analysis?.recommendedPositioning ?? "Run analysis to generate positioning guidance."}
          </div>
        </div>
        <Section title="Strong Matches" items={analysis?.strengths ?? []} />
        <Section title="Missing Keywords" items={analysis?.gaps ?? []} />
        <Section title="Recruiter Concerns" items={analysis?.recruiterRisks ?? []} />
        <Section title="Extracted Keywords" items={analysis?.keywords ?? []} />
      </CardContent>
    </Card>
  );
}

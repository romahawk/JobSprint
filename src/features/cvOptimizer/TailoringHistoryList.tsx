import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import type { CvTailoringRun } from "../../app/types/jobOs";

interface TailoringHistoryListProps {
  runs: CvTailoringRun[];
  onReuse: (run: CvTailoringRun) => void;
}

export function TailoringHistoryList({ runs, onReuse }: TailoringHistoryListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Tailoring History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {runs.length > 0 ? (
          runs.map((run) => (
            <div key={run.id} className="rounded-xl border border-border px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-foreground">{run.mode}</div>
                  <div className="text-xs text-muted-foreground">{new Date(run.createdAt).toLocaleString()}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => onReuse(run)}>
                  Reuse
                </Button>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {(run.tailoredHeadline || run.recommendedPositioning || run.strengths[0] || "Saved analysis").slice(0, 120)}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Saved runs will appear here after analysis or tailoring.</p>
        )}
      </CardContent>
    </Card>
  );
}

import { Badge } from "../../app/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../app/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import type { FitAnalysisResult } from "../../services/cvOptimizerService";

interface FitAnalysisPanelProps {
  analysis: FitAnalysisResult | null;
}

function CompactList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item} variant="outline" className="rounded-full px-3 py-1 text-xs">
          {item}
        </Badge>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white/70 p-4 dark:bg-neutral-950/40">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold leading-none text-foreground">{value}</div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}

export function FitAnalysisPanel({ analysis }: FitAnalysisPanelProps) {
  const strengths = analysis?.strengths ?? [];
  const gaps = analysis?.gaps ?? [];
  const risks = analysis?.recruiterRisks ?? [];
  const keywords = analysis?.keywords ?? [];

  return (
    <Card className="border-brand-blue/15 bg-gradient-to-b from-white to-slate-50 dark:from-neutral-950 dark:to-neutral-900">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm">Fit Analysis</CardTitle>
        <p className="text-xs text-muted-foreground">
          Local estimate based on keyword, skill, and portfolio overlap from the selected CV asset and linked profile.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-brand-blue/20 bg-brand-blue px-4 py-4 text-white shadow-sm">
            <div className="text-xs uppercase tracking-[0.24em] text-white/70">Fit Score</div>
            <div className="mt-2 text-4xl font-semibold">{analysis?.fitScore ?? 0}%</div>
            <div className="mt-2 text-sm leading-6 text-white/80">
              {analysis?.recommendedPositioning ?? "Run analysis to generate positioning guidance."}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard
              label="Matches"
              value={strengths.length}
              description="Signals already supported by the selected CV source."
            />
            <StatCard
              label="Gaps"
              value={gaps.length}
              description="Keywords or themes not strongly represented yet."
            />
            <StatCard
              label="Concerns"
              value={risks.length}
              description="Potential recruiter hesitation points to watch."
            />
            <StatCard
              label="Keywords"
              value={keywords.length}
              description="Extracted role language used for matching and tailoring."
            />
          </div>
        </div>

        <Accordion type="multiple" defaultValue={["matches", "gaps"]} className="rounded-2xl border border-border bg-white/50 px-4 dark:bg-neutral-950/30">
          <AccordionItem value="matches">
            <AccordionTrigger className="py-3 text-sm font-semibold">
              <span className="flex items-center gap-2">
                <span>Strong matches</span>
                <Badge variant="outline" className="rounded-full px-2 py-0 text-[11px]">
                  {strengths.length}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <CompactList items={strengths} emptyLabel="No strong matches yet." />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="gaps">
            <AccordionTrigger className="py-3 text-sm font-semibold">
              <span className="flex items-center gap-2">
                <span>Missing keywords</span>
                <Badge variant="outline" className="rounded-full px-2 py-0 text-[11px]">
                  {gaps.length}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <CompactList items={gaps} emptyLabel="No keyword gaps detected yet." />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="concerns">
            <AccordionTrigger className="py-3 text-sm font-semibold">
              <span className="flex items-center gap-2">
                <span>Recruiter concerns</span>
                <Badge variant="outline" className="rounded-full px-2 py-0 text-[11px]">
                  {risks.length}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <CompactList items={risks} emptyLabel="No recruiter concerns yet." />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="keywords">
            <AccordionTrigger className="py-3 text-sm font-semibold">
              <span className="flex items-center gap-2">
                <span>Extracted keywords</span>
                <Badge variant="outline" className="rounded-full px-2 py-0 text-[11px]">
                  {keywords.length}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <CompactList items={keywords} emptyLabel="No keywords extracted yet." />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

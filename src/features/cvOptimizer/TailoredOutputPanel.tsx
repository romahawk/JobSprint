import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import type { FullTailorResult, QuickTailorResult } from "../../services/cvOptimizerService";

interface TailoredOutputPanelProps {
  mode: "analysis" | "quickTailor" | "fullTailor";
  output: QuickTailorResult | FullTailorResult | null;
  onCopySummary: () => void;
  onCopyBullets: () => void;
  onCopyFullCv: () => void;
  onSaveToApplication: () => void;
  onExport: () => void;
  saveDisabled?: boolean;
}

export function TailoredOutputPanel({
  mode,
  output,
  onCopySummary,
  onCopyBullets,
  onCopyFullCv,
  onSaveToApplication,
  onExport,
  saveDisabled,
}: TailoredOutputPanelProps) {
  const fullCvText = output && "fullCvText" in output ? output.fullCvText : "";

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">Generated Output</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onCopySummary} disabled={!output?.summary}>
            Copy Summary
          </Button>
          <Button size="sm" variant="outline" onClick={onCopyBullets} disabled={!output?.rewrittenBullets?.length}>
            Copy Bullets
          </Button>
          <Button size="sm" variant="outline" onClick={onCopyFullCv} disabled={!fullCvText}>
            Copy Full CV
          </Button>
          <Button size="sm" onClick={onSaveToApplication} disabled={saveDisabled || !output}>
            Save to application
          </Button>
          <Button size="sm" variant="secondary" onClick={onExport} disabled={!output}>
            Export
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Headline</div>
          <p className="mt-2 text-base font-medium text-foreground">{output?.headline || "Run tailoring to generate a role-aligned headline."}</p>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Summary</div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
            {output?.summary || "Your tailored summary will appear here."}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Rewritten Bullets</div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-foreground">
            {output?.rewrittenBullets?.length ? (
              output.rewrittenBullets.map((bullet) => <li key={bullet}>- {bullet}</li>)
            ) : (
              <li className="text-muted-foreground">Tailored bullets will appear here.</li>
            )}
          </ul>
        </div>

        {mode === "fullTailor" ? (
          <div className="rounded-xl border border-border bg-brand-navy/5 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Full CV Draft</div>
            <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{fullCvText || "Full CV output will appear here."}</pre>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

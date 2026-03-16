import { useState } from "react";
import { Expand, FileText } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../app/components/ui/accordion";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../app/components/ui/dialog";
import { ScrollArea } from "../../app/components/ui/scroll-area";
import type { FullTailorResult, QuickTailorResult } from "../../services/cvOptimizerService";

interface TailoredOutputPanelProps {
  mode: "analysis" | "quickTailor" | "fullTailor";
  output: QuickTailorResult | FullTailorResult | null;
  originalCvText?: string;
  onCopySummary: () => void;
  onCopyBullets: () => void;
  onCopyFullCv: () => void;
  onSaveToApplication: () => void;
  onExport: () => void;
  saveDisabled?: boolean;
  isBusy?: boolean;
  busyLabel?: string;
}

export function TailoredOutputPanel({
  mode,
  output,
  originalCvText,
  onCopySummary,
  onCopyBullets,
  onCopyFullCv,
  onSaveToApplication,
  onExport,
  saveDisabled,
  isBusy = false,
  busyLabel,
}: TailoredOutputPanelProps) {
  const [isFullCvDialogOpen, setIsFullCvDialogOpen] = useState(false);
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false);
  const fullCvText = output && "fullCvText" in output ? output.fullCvText : "";
  const hasCompareSource = Boolean(fullCvText && originalCvText?.trim());

  return (
    <>
      <Card className="h-full overflow-hidden border-brand-blue/10 bg-gradient-to-b from-slate-50 to-white dark:from-neutral-950 dark:to-[#141b2b]">
        <CardHeader className="gap-4 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm">Generated Output</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Review the tailored messaging first, then open the full CV draft in expanded view when you need the full document.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={onCopySummary} disabled={isBusy || !output?.summary}>
                Copy Summary
              </Button>
              <Button size="sm" variant="outline" onClick={onCopyBullets} disabled={isBusy || !output?.rewrittenBullets?.length}>
                Copy Bullets
              </Button>
              <Button size="sm" variant="outline" onClick={onCopyFullCv} disabled={isBusy || !fullCvText}>
                Copy Full CV
              </Button>
              <Button size="sm" onClick={onSaveToApplication} disabled={isBusy || saveDisabled || !output}>
                Save to application
              </Button>
              <Button size="sm" variant="secondary" onClick={onExport} disabled={isBusy || !output}>
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isBusy ? (
            <div className="rounded-xl border border-brand-blue/20 bg-brand-blue/5 px-4 py-3 text-sm text-foreground">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-brand-blue animate-pulse" aria-hidden="true" />
                <span className="font-medium">{busyLabel || "Working..."}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">JobSprint will update this panel as soon as the result is ready.</p>
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
            <div className="rounded-2xl border border-border bg-white/70 p-4 dark:bg-neutral-950/40">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Headline</div>
              <p className="mt-3 text-lg font-semibold leading-8 text-foreground">
                {output?.headline || "Run tailoring to generate a role-aligned headline."}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white/70 p-4 dark:bg-neutral-950/40">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Summary</div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground">
                {output?.summary || "Your tailored summary will appear here."}
              </p>
            </div>
          </div>

          <Accordion type="multiple" defaultValue={["bullets"]} className="rounded-2xl border border-border bg-white/50 px-4 dark:bg-neutral-950/30">
            <AccordionItem value="bullets">
              <AccordionTrigger className="py-3 text-sm font-semibold">Rewritten bullets</AccordionTrigger>
              <AccordionContent>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <ul className="space-y-2 text-sm leading-6 text-foreground">
                    {output?.rewrittenBullets?.length ? (
                      output.rewrittenBullets.map((bullet) => <li key={bullet}>- {bullet}</li>)
                    ) : (
                      <li className="text-muted-foreground">Tailored bullets will appear here.</li>
                    )}
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {mode === "fullTailor" ? (
              <AccordionItem value="full-cv">
                <AccordionTrigger className="py-3 text-sm font-semibold">Full CV draft</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 rounded-xl border border-border bg-brand-navy/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/60 px-3 py-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>Read the tailored CV here or open a large reader window for focused review.</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setIsCompareDialogOpen(true)} disabled={!hasCompareSource}>
                          Compare
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setIsFullCvDialogOpen(true)} disabled={!fullCvText}>
                          <Expand className="mr-2 h-4 w-4" />
                          Expand full page
                        </Button>
                      </div>
                    </div>

                    {fullCvText ? (
                      <ScrollArea className="h-[560px] rounded-lg border border-border bg-[#0f1524] px-4 py-4">
                        <pre className="whitespace-pre-wrap font-mono text-sm leading-6 text-slate-100">{fullCvText}</pre>
                      </ScrollArea>
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm leading-6 text-foreground">Full CV output will appear here.</pre>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ) : null}
          </Accordion>
        </CardContent>
      </Card>

      <Dialog open={isFullCvDialogOpen} onOpenChange={setIsFullCvDialogOpen}>
        <DialogContent className="left-1/2 top-1/2 h-[92vh] max-h-[900px] w-[94vw] max-w-[1600px] -translate-x-1/2 -translate-y-1/2 border border-white/10 bg-[#0c1220] p-0 text-slate-100 shadow-2xl sm:max-w-[1600px]">
          <DialogHeader className="border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between gap-3 pr-10">
              <DialogTitle className="text-base font-semibold text-slate-100">Tailored full CV draft</DialogTitle>
              <Button size="sm" variant="outline" onClick={onCopyFullCv} disabled={!fullCvText}>
                Copy tailored CV
              </Button>
            </div>
          </DialogHeader>
          <div className="px-6 pb-6 pt-4">
            <ScrollArea className="h-[calc(92vh-5.5rem)] max-h-[calc(900px-5.5rem)] rounded-b-lg border-t border-white/10 bg-[#0f1524] px-6 py-6">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-7 text-slate-100">{fullCvText || "Full CV output will appear here."}</pre>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCompareDialogOpen} onOpenChange={setIsCompareDialogOpen}>
        <DialogContent className="left-1/2 top-1/2 h-[92vh] max-h-[900px] w-[96vw] max-w-[1800px] -translate-x-1/2 -translate-y-1/2 border border-white/10 bg-[#0c1220] p-0 text-slate-100 shadow-2xl sm:max-w-[1800px]">
          <DialogHeader className="border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between gap-3 pr-10">
              <DialogTitle className="text-base font-semibold text-slate-100">Original CV vs tailored CV</DialogTitle>
              <Button size="sm" variant="outline" onClick={onCopyFullCv} disabled={!fullCvText}>
                Copy tailored CV
              </Button>
            </div>
          </DialogHeader>
          <div className="grid h-[calc(92vh-5.5rem)] max-h-[calc(900px-5.5rem)] gap-0 lg:grid-cols-2">
            <div className="flex min-h-0 flex-col border-r border-white/10">
              <div className="border-b border-white/10 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Original CV
              </div>
              <ScrollArea className="min-h-0 flex-1 bg-[#0f1524] px-6 py-6">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-7 text-slate-100">{originalCvText || "Original CV text is not available."}</pre>
              </ScrollArea>
            </div>
            <div className="flex min-h-0 flex-col">
              <div className="border-b border-white/10 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Tailored CV
              </div>
              <ScrollArea className="min-h-0 flex-1 bg-[#10182a] px-6 py-6">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-7 text-slate-100">{fullCvText || "Tailored CV output will appear here."}</pre>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

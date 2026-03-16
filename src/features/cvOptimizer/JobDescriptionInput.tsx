import { useState } from "react";
import { ChevronDown, ChevronUp, CircleHelp, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Input } from "../../app/components/ui/input";
import { Label } from "../../app/components/ui/label";
import { Textarea } from "../../app/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../app/components/ui/tooltip";

interface JobDescriptionInputProps {
  company: string;
  title: string;
  sourceUrl: string;
  rawText: string;
  onChange: (field: "company" | "title" | "sourceUrl" | "rawText", value: string) => void;
  roleHint?: string | null;
}

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

export function JobDescriptionInput({
  company,
  title,
  sourceUrl,
  rawText,
  onChange,
  roleHint,
}: JobDescriptionInputProps) {
  const [isExpanded, setIsExpanded] = useState(rawText.trim().length === 0);
  const preview = rawText.trim().replace(/\s+/g, " ").slice(0, 160);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm">Job Description</CardTitle>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>JD context for fit + live tailoring</span>
              <InlineInfoTip label="Keep the raw JD here for fit analysis and live tailoring context." />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/25 px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Company</div>
            <div className="mt-1 truncate text-sm text-foreground">{company || "Not set"}</div>
          </div>
          <div className="rounded-xl border border-border bg-muted/25 px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Role</div>
            <div className="mt-1 truncate text-sm text-foreground">{title || "Not set"}</div>
          </div>
          <div className="rounded-xl border border-border bg-muted/25 px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">JD Size</div>
            <div className="mt-1 text-sm text-foreground">{rawText.trim().length ? `${rawText.trim().length.toLocaleString()} chars` : "Empty"}</div>
          </div>
        </div>

        {!isExpanded ? (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex w-full items-start gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-3 text-left transition-colors hover:bg-muted/35"
          >
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Preview</div>
              <p className="mt-1 text-sm leading-6 text-foreground">
                {preview || "No job description pasted yet. Expand this panel to add role context."}
              </p>
            </div>
          </button>
        ) : null}

        {isExpanded ? (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cv-company">Company</Label>
                <Input id="cv-company" value={company} onChange={(event) => onChange("company", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cv-title">Role title</Label>
                <Input id="cv-title" value={title} onChange={(event) => onChange("title", event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cv-source-url">Role URL</Label>
              <Input
                id="cv-source-url"
                value={sourceUrl}
                onChange={(event) => onChange("sourceUrl", event.target.value)}
                placeholder="https://..."
              />
              {roleHint ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Prefill hint available</span>
                  <InlineInfoTip label={roleHint} />
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cv-job-description">Paste or sync the job description</Label>
              <Textarea
                id="cv-job-description"
                value={rawText}
                onChange={(event) => onChange("rawText", event.target.value)}
                rows={12}
                className="max-h-[420px] resize-y"
                placeholder="Paste the role description here. If the linked role already has a stored description, it will load automatically."
              />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

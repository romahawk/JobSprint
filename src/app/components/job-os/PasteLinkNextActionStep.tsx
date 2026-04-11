import { CircleHelp } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { cn } from "../ui/utils";

export type InitialImportStage = "saved" | "to_apply" | "applied";

const STAGE_OPTIONS: Array<{
  value: InitialImportStage;
  label: string;
  description: string;
}> = [
  {
    value: "saved",
    label: "Saved",
    description: "Capture the role now and decide what to do next from the pipeline.",
  },
  {
    value: "to_apply",
    label: "To Apply",
    description: "Mark it as ready for execution without creating an application yet.",
  },
  {
    value: "applied",
    label: "Applied",
    description: "Create the first application record immediately and carry the next step with it.",
  },
];

const NEXT_ACTION_OPTIONS = [
  "Tailor CV",
  "Apply",
  "Research",
  "Follow up",
] as const;

interface PasteLinkNextActionStepProps {
  roleTitle?: string;
  stage: InitialImportStage;
  nextAction: string;
  isSaving: boolean;
  onStageChange: (stage: InitialImportStage) => void;
  onNextActionChange: (nextAction: string) => void;
  onBack: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export function PasteLinkNextActionStep({
  roleTitle,
  stage,
  nextAction,
  isSaving,
  onStageChange,
  onNextActionChange,
  onBack,
  onCancel,
  onSave,
}: PasteLinkNextActionStepProps) {
  function handleNextActionKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !isSaving && nextAction.trim()) {
      event.preventDefault();
      onSave();
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Set the first workflow move</h3>
        <p className="text-sm text-muted-foreground">
          {roleTitle
            ? `Choose how ${roleTitle} should enter the pipeline and what happens next.`
            : "Choose how this import should enter the pipeline and what happens next."}
        </p>
      </div>

      <section className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Label>Initial Stage</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="How initial stage works"
                >
                  <CircleHelp className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                Pick the starting lane. You can change it later if the workflow changes.
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {STAGE_OPTIONS.map((option) => {
            const active = stage === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onStageChange(option.value)}
                disabled={isSaving}
                className={cn(
                  "rounded-lg border px-4 py-3 text-left transition-colors",
                  "hover:border-primary/60 hover:bg-primary/5",
                  active
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-background"
                )}
              >
                <div className="text-sm font-medium">{option.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {option.description}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Label htmlFor="paste-link-next-action">Next Action</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="How next action works"
                >
                  <CircleHelp className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                This becomes the first visible cue in your workflow after the import is saved.
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {NEXT_ACTION_OPTIONS.map((option) => {
            const active = nextAction === option;
            return (
              <Button
                key={option}
                type="button"
                variant={active ? "default" : "outline"}
                size="sm"
                disabled={isSaving}
                onClick={() => onNextActionChange(option)}
              >
                {option}
              </Button>
            );
          })}
        </div>

        <Input
          id="paste-link-next-action"
          value={nextAction}
          onChange={(event) => onNextActionChange(event.target.value)}
          onKeyDown={handleNextActionKeyDown}
          placeholder="e.g. Tailor CV for this role"
          disabled={isSaving}
        />
        <p className="text-xs text-muted-foreground">
          Press Enter to save once the action looks right.
        </p>
      </section>

      <div className="flex gap-2 justify-end pt-2 border-t">
        <Button variant="outline" onClick={onBack} disabled={isSaving}>
          Back
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={!nextAction.trim() || isSaving}>
          {isSaving ? "Saving..." : "Save Import"}
        </Button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router";
import { CheckCircle2, ChevronDown, ChevronUp, ArrowRight, Link2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { PasteLinkReviewStep } from "../job-os/PasteLinkReviewStep";
import {
  PasteLinkNextActionStep,
  type InitialImportStage,
} from "../job-os/PasteLinkNextActionStep";
import {
  normalizeImportResult,
  parseFromInput,
} from "../../services/ingestion/companyIngestionService";
import type {
  ImportMode,
  NormalizedCompanyDraft,
  NormalizedImportResult,
  NormalizedRoleDraft,
} from "../../services/ingestion/types";
import type {
  JobOsApplication,
  JobOsCompany,
  JobOsRole,
} from "../../types/jobOs";
import { appPath } from "../../routing";

type Step = "input" | "analyzing" | "reviewing" | "next_action" | "saving" | "done";

const STEP_LABELS = ["Paste link", "Review", "Confirm"] as const;
function stepIndex(step: Step): number {
  if (step === "input" || step === "analyzing") return 0;
  if (step === "reviewing") return 1;
  return 2; // next_action | saving | done
}

function StepBar({ step }: { step: Step }) {
  const current = stepIndex(step);
  return (
    <div className="flex items-center justify-center gap-3 mb-6" aria-label="Onboarding progress">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i < current
                  ? "bg-primary"
                  : i === current
                  ? "bg-primary ring-2 ring-primary/30"
                  : "bg-neutral-300 dark:bg-neutral-700"
              }`}
            />
            <span
              className={`text-[10px] font-medium ${
                i === current
                  ? "text-primary"
                  : "text-neutral-400 dark:text-neutral-600"
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div
              className={`h-px w-8 -mt-3 transition-colors ${
                i < current ? "bg-primary" : "bg-neutral-200 dark:bg-neutral-800"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

interface PendingImportState {
  companyDraft: NormalizedCompanyDraft;
  roleDraft: NormalizedRoleDraft | undefined;
  mode: ImportMode;
  updateExistingId?: string;
}

interface FirstRunScreenProps {
  existingCompanies: JobOsCompany[];
  addCompany: (
    payload: Omit<JobOsCompany, "id" | "createdAt" | "updatedAt">
  ) => Promise<string | null>;
  updateCompany: (id: string, updates: Partial<JobOsCompany>) => Promise<void>;
  addRole: (
    payload: Omit<JobOsRole, "id" | "createdAt" | "updatedAt">
  ) => Promise<string | null>;
  addApplication: (
    payload: Omit<JobOsApplication, "id" | "createdAt" | "updatedAt">
  ) => Promise<string | null>;
  onDismiss: () => void;
  onComplete: () => void;
}

export function FirstRunScreen({
  existingCompanies,
  addCompany,
  updateCompany,
  addRole,
  addApplication,
  onDismiss,
  onComplete,
}: FirstRunScreenProps) {
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NormalizedImportResult | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImportState | null>(null);
  const [initialStage, setInitialStage] = useState<InitialImportStage>("to_apply");
  const [nextAction, setNextAction] = useState("Apply");

  async function handleAnalyze() {
    const trimmed = url.trim();
    if (!trimmed) return;

    setError(null);
    setStep("analyzing");

    try {
      const parsed = await parseFromInput({ url: trimmed });
      const normalized = normalizeImportResult(parsed, trimmed, existingCompanies);
      setResult(normalized);
      setStep("reviewing");
    } catch {
      setError(
        "Could not read that URL. Try entering the company and role manually if the posting is blocked."
      );
      setStep("input");
    }
  }

  function handleReviewContinue(
    companyDraft: NormalizedCompanyDraft,
    roleDraft: NormalizedRoleDraft | undefined,
    mode: ImportMode,
    updateExistingId?: string
  ) {
    setPendingImport({
      companyDraft,
      roleDraft,
      mode,
      updateExistingId,
    });

    if (mode === "company_and_role" && roleDraft) {
      setInitialStage(roleDraft.status === "applied" ? "applied" : "to_apply");
      setNextAction(roleDraft.nextAction?.trim() || "Apply");
      setStep("next_action");
      return;
    }

    setInitialStage("saved");
    setNextAction("Research");
    void handleSave(
      {
        companyDraft,
        roleDraft,
        mode,
        updateExistingId,
      },
      "saved",
      "Research"
    );
  }

  async function handleSave(
    pending: PendingImportState,
    stage: InitialImportStage,
    action: string
  ) {
    setStep("saving");

    try {
      const {
        englishFirst,
        sourceType: companySourceType,
        ...coreCompany
      } = pending.companyDraft;

      const companyPayload: Omit<JobOsCompany, "id" | "createdAt" | "updatedAt"> = {
        ...coreCompany,
        englishFirst: (englishFirst as JobOsCompany["englishFirst"]) ?? undefined,
        sourceType: (companySourceType as JobOsCompany["sourceType"]) ?? undefined,
      };

      let companyId: string | null;
      if (pending.updateExistingId) {
        await updateCompany(pending.updateExistingId, companyPayload);
        companyId = pending.updateExistingId;
      } else {
        companyId = await addCompany(companyPayload);
      }

      if (pending.mode === "company_and_role" && pending.roleDraft && companyId) {
        const {
          sourceType: roleSourceType,
          ...coreRole
        } = pending.roleDraft;

        const roleId = await addRole({
          ...coreRole,
          companyId,
          status: stage === "applied" ? "applied" : "to_apply",
          nextAction: action,
          sourceType: (roleSourceType as JobOsRole["sourceType"]) ?? undefined,
        });

        if (stage === "applied" && roleId) {
          await addApplication({
            companyId,
            roleId,
            dateApplied: new Date().toISOString().slice(0, 10),
            channel: "Imported link",
            cvAssetId: undefined,
            cvVersion: "",
            status: "sent",
            nextAction: action,
            notes: "",
            latestJobDescriptionId: undefined,
            latestCvTailoringRunId: undefined,
            tailoredCvHeadline: "",
            tailoredCvSummary: "",
            tailoredCvText: "",
            tailoredCvUpdatedAt: undefined,
          });
        }
      }

      setStep("done");
    } catch {
      setError("Failed to save. Please try again.");
      setStep(pending.mode === "company_and_role" && pending.roleDraft ? "next_action" : "reviewing");
    }
  }

  const isAnalyzing = step === "analyzing";

  return (
    <div className="flex min-h-[calc(100vh-7.5rem)] items-center justify-center px-4 py-4">
      {step === "done" ? (
        <div className="mx-auto w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 text-center space-y-4">
          <CheckCircle2 className="mx-auto w-12 h-12 text-green-500" />
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            First opportunity added
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Your company and role are now in the pipeline. The Command Centre will surface your next move.
          </p>
          <Button className="w-full" onClick={onComplete}>
            Go to Command Centre
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ) : step === "input" || step === "analyzing" ? (
        <section className="w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white px-6 py-8 shadow-[0_28px_80px_-52px_rgba(15,23,42,0.55)] dark:border-slate-800 dark:bg-slate-950 sm:px-8">
          <StepBar step={step} />
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:text-[2rem]">
              Paste your first job link
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Start with one real opportunity and JobSprint will build the first company and role context around it.
            </p>

            <div className="mt-8 space-y-3 text-left">
              <Input
                placeholder="https://boards.greenhouse.io/... or https://jobs.ashbyhq.com/..."
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleAnalyze();
                }}
                disabled={isAnalyzing}
                className="h-12 rounded-xl px-4 text-base"
                autoFocus
              />
              <Button
                size="lg"
                onClick={handleAnalyze}
                disabled={!url.trim() || isAnalyzing}
                className="h-12 w-full rounded-xl gap-2 text-sm font-semibold"
              >
                {isAnalyzing ? (
                  "Analyzing..."
                ) : (
                  <>
                    Import first job
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-center text-xs leading-5 text-neutral-500">
                Supports LinkedIn, Greenhouse, Lever, Ashby, Himalayas, and most career pages.
              </p>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            ) : null}

            <div className="mt-5 flex items-center justify-center">
              <Button
                variant="ghost"
                asChild
                className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <Link to={appPath("/job-os/companies")} onClick={onDismiss}>
                  Enter manually
                </Link>
              </Button>
            </div>

            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 text-left dark:border-slate-800 dark:bg-slate-900/40">
                <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <span>How it works</span>
                  <span className="ml-auto text-neutral-400">
                    {detailsOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t border-slate-200 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                    We extract the company, role, and job description from the link, then guide you through review and the first pipeline action before anything is saved.
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>
        </section>
      ) : (
        <div className="mx-auto w-full max-w-2xl rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <StepBar step={step} />
          <div className="mb-5 space-y-1">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {step === "reviewing" ? "Review extracted details" : "Set the first workflow move"}
            </h2>
            <p className="text-sm text-neutral-500">
              {step === "reviewing"
                ? "Confirm what we found, then choose how the role should enter your pipeline."
                : "Finish the import with a clear starting stage and next action."}
            </p>
          </div>

          {step === "reviewing" && result ? (
            <PasteLinkReviewStep
              result={result}
              defaultMode="company_and_role"
              onContinue={handleReviewContinue}
              onBack={() => {
                setStep("input");
                setResult(null);
              }}
              onCancel={onDismiss}
            />
          ) : null}

          {(step === "next_action" || step === "saving") && pendingImport ? (
            <PasteLinkNextActionStep
              roleTitle={pendingImport.roleDraft?.title}
              stage={initialStage}
              nextAction={nextAction}
              isSaving={step === "saving"}
              onStageChange={setInitialStage}
              onNextActionChange={setNextAction}
              onBack={() => setStep("reviewing")}
              onCancel={onDismiss}
              onSave={() => void handleSave(pendingImport, initialStage, nextAction.trim())}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

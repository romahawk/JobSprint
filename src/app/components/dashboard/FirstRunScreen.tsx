import { useState } from "react";
import { Link } from "react-router";
import { ChevronDown, ChevronUp, ArrowRight, Link2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { PasteLinkReviewStep } from "../job-os/PasteLinkReviewStep";
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
import type { JobOsCompany, JobOsRole } from "../../types/jobOs";

type Step = "input" | "analyzing" | "reviewing" | "saving";

interface FirstRunScreenProps {
  existingCompanies: JobOsCompany[];
  addCompany: (
    payload: Omit<JobOsCompany, "id" | "createdAt" | "updatedAt">
  ) => Promise<string | null>;
  updateCompany: (id: string, updates: Partial<JobOsCompany>) => Promise<void>;
  addRole: (
    payload: Omit<JobOsRole, "id" | "createdAt" | "updatedAt">
  ) => Promise<string | null>;
  onDismiss: () => void;
  onComplete: () => void;
}

export function FirstRunScreen({
  existingCompanies,
  addCompany,
  updateCompany,
  addRole,
  onDismiss,
  onComplete,
}: FirstRunScreenProps) {
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NormalizedImportResult | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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

  async function handleSave(
    companyDraft: NormalizedCompanyDraft,
    roleDraft: NormalizedRoleDraft | undefined,
    mode: ImportMode,
    updateExistingId?: string
  ) {
    setStep("saving");
    try {
      const {
        englishFirst,
        sourceType: cSourceType,
        ...coreCompany
      } = companyDraft;

      const companyPayload: Omit<JobOsCompany, "id" | "createdAt" | "updatedAt"> = {
        ...coreCompany,
        englishFirst: (englishFirst as JobOsCompany["englishFirst"]) ?? undefined,
        sourceType: (cSourceType as JobOsCompany["sourceType"]) ?? undefined,
      };

      let companyId: string | null;
      if (updateExistingId) {
        await updateCompany(updateExistingId, companyPayload);
        companyId = updateExistingId;
      } else {
        companyId = await addCompany(companyPayload);
      }

      if (mode === "company_and_role" && roleDraft && companyId) {
        const { sourceType: rSourceType, ...coreRole } = roleDraft;
        await addRole({
          ...coreRole,
          companyId,
          sourceType: (rSourceType as JobOsRole["sourceType"]) ?? undefined,
        });
      }

      onComplete();
    } catch {
      setError("Failed to save. Please try again.");
      setStep("reviewing");
    }
  }

  const isAnalyzing = step === "analyzing";

  return (
    <div className="flex min-h-[calc(100vh-7.5rem)] items-center justify-center px-4 py-4">
      {step === "input" || step === "analyzing" ? (
        <section className="w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white px-6 py-8 shadow-[0_28px_80px_-52px_rgba(15,23,42,0.55)] dark:border-slate-800 dark:bg-slate-950 sm:px-8">
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
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAnalyze();
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
              <Button variant="ghost" asChild className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200">
                <Link to="/job-os/companies" onClick={onDismiss}>
                  Enter manually
                </Link>
              </Button>
            </div>

            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 text-left dark:border-slate-800 dark:bg-slate-900/40">
                <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <span>How it works</span>
                  <span className="ml-auto text-neutral-400">
                    {detailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t border-slate-200 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                    We extract the company, role, and job description from the link, then send you to a quick review step before anything is saved.
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>
        </section>
      ) : (
        <div className="mx-auto w-full max-w-2xl rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="mb-5 space-y-1">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Review extracted details
            </h2>
            <p className="text-sm text-neutral-500">
              Confirm what we found, then save your first company and role.
            </p>
          </div>
          {result ? (
            <PasteLinkReviewStep
              result={result}
              defaultMode="company_and_role"
              isSaving={step === "saving"}
              onSave={handleSave}
              onBack={() => {
                setStep("input");
                setResult(null);
              }}
              onCancel={onDismiss}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

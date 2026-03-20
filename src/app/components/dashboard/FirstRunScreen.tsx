import { useState } from "react";
import { Link2, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { PasteLinkReviewStep } from "../job-os/PasteLinkReviewStep";
import {
  parseFromInput,
  normalizeImportResult,
} from "../../services/ingestion/companyIngestionService";
import type {
  ImportMode,
  NormalizedImportResult,
  NormalizedCompanyDraft,
  NormalizedRoleDraft,
} from "../../services/ingestion/types";
import type { JobOsCompany, JobOsRole } from "../../types/jobOs";

const ONBOARDING_SKIPPED_KEY = "jobsprint_onboarding_skipped";

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
  onSkip: () => void;
}

export function FirstRunScreen({
  existingCompanies,
  addCompany,
  updateCompany,
  addRole,
  onSkip,
}: FirstRunScreenProps) {
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NormalizedImportResult | null>(null);

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
      setError("Could not read that URL. Try pasting the job description text in the full importer instead.");
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
      // Dashboard auto-reveals when companies/roles become non-empty
    } catch {
      setError("Failed to save. Please try again.");
      setStep("reviewing");
    }
  }

  function handleSkip() {
    localStorage.setItem(ONBOARDING_SKIPPED_KEY, "1");
    onSkip();
  }

  const isAnalyzing = step === "analyzing";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16">
      {step === "input" || step === "analyzing" ? (
        <div className="w-full max-w-xl space-y-8 text-center">
          {/* Hero */}
          <div className="space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Link2 className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Paste a job URL to begin
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              We'll pull in the company, role, and job description automatically
              — then your pipeline and daily actions come to life.
            </p>
          </div>

          {/* URL input */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="https://boards.greenhouse.io/… or lever.co/…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAnalyze(); }}
                disabled={isAnalyzing}
                className="h-12 text-base"
                autoFocus
              />
              <Button
                size="lg"
                onClick={handleAnalyze}
                disabled={!url.trim() || isAnalyzing}
                className="shrink-0 gap-2"
              >
                {isAnalyzing ? (
                  "Analyzing…"
                ) : (
                  <>Go <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>
            <p className="text-xs text-neutral-400">
              Supports Greenhouse, Lever, Ashby, Himalayas, and most ATS pages.
              For LinkedIn, paste the job description text after clicking Go.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Skip */}
          <button
            onClick={handleSkip}
            className="text-sm text-neutral-400 underline-offset-2 hover:text-neutral-600 hover:underline dark:hover:text-neutral-300"
          >
            Skip — I'll set up manually
          </button>
        </div>
      ) : (
        /* Review step — reuse existing component */
        <div className="w-full max-w-2xl rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="mb-5 space-y-1">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Review extracted details
            </h2>
            <p className="text-sm text-neutral-500">
              Confirm what we found, then save to unlock your pipeline.
            </p>
          </div>
          {result && (
            <PasteLinkReviewStep
              result={result}
              defaultMode="company_and_role"
              isSaving={step === "saving"}
              onSave={handleSave}
              onBack={() => { setStep("input"); setResult(null); }}
              onCancel={handleSkip}
            />
          )}
        </div>
      )}
    </div>
  );
}

export { ONBOARDING_SKIPPED_KEY };

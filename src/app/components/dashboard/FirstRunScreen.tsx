import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  Link2,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
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
import type { DashboardOnboardingStatus } from "../../services/dashboardOnboarding";

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

const ONBOARDING_STEPS = [
  {
    title: "Capture the role into Job OS",
    description:
      "Paste one posting and JobSprint creates the company, role, and job description context for your pipeline.",
    icon: BriefcaseBusiness,
  },
  {
    title: "See fit before you apply",
    description:
      "Use the saved role in CV Fit to understand strengths, gaps, and the positioning that will matter most.",
    icon: Workflow,
  },
  {
    title: "Tailor with real context",
    description:
      "Move into CV Tailor when you are ready to adapt your best CV version to that exact opportunity.",
    icon: Sparkles,
  },
] as const;

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
        "Could not read that URL. Try pasting the job description text in the full importer instead."
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
    <div className="flex min-h-[calc(100vh-4rem)] flex-col justify-center px-4 py-10">
      {step === "input" || step === "analyzing" ? (
        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_36%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.96))] p-8 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.20),_transparent_32%),linear-gradient(135deg,_rgba(10,15,30,0.98),_rgba(5,8,18,0.96))]">
            <div className="max-w-2xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 backdrop-blur dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                First Login Flow
              </div>

              <div className="space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/12 shadow-inner shadow-primary/10">
                  <Link2 className="h-8 w-8 text-primary" />
                </div>
                <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                  Start with one real job and let JobSprint build the system around it
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
                  Instead of dropping you into an empty workspace, this first-login flow
                  uses your first opportunity to create context across the pipeline.
                  Import one posting now, then move naturally into Job OS, CV fit, and CV tailoring.
                </p>
              </div>

              <div className="grid gap-3">
                {ONBOARDING_STEPS.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="flex items-start gap-4 rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/45"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          <Icon className="h-4 w-4 text-primary" />
                          {item.title}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  to="/job-os/roles"
                  className="rounded-full border border-slate-300/80 px-4 py-2 text-slate-700 transition-colors hover:border-primary/40 hover:text-slate-950 dark:border-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                >
                  Preview Job OS
                </Link>
                <Link
                  to="/cv-optimizer"
                  className="rounded-full border border-slate-300/80 px-4 py-2 text-slate-700 transition-colors hover:border-primary/40 hover:text-slate-950 dark:border-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                >
                  Explore CV Fit / Tailor
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_-40px_rgba(15,23,42,0.55)] dark:border-slate-800 dark:bg-slate-950">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                  Guided Setup
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                  Import your first opportunity
                </h2>
                <p className="text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  Paste a job URL and we will extract the role, attach the job description,
                  and give you a useful first record to build from.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  What this unlocks
                </div>
                <div className="mt-2 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <div>Job OS gets your first company and role.</div>
                  <div>You can open CV Fit with the same role context.</div>
                  <div>Your dashboard starts surfacing meaningful next actions.</div>
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="https://boards.greenhouse.io/... or https://jobs.ashbyhq.com/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAnalyze();
                  }}
                  disabled={isAnalyzing}
                  className="h-12 text-base"
                  autoFocus
                />
                <Button
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={!url.trim() || isAnalyzing}
                  className="h-12 w-full gap-2"
                >
                  {isAnalyzing ? (
                    "Analyzing..."
                  ) : (
                    <>
                      Import first role <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
                <p className="text-xs leading-5 text-neutral-400">
                  Supports Greenhouse, Lever, Ashby, Himalayas, and most ATS pages.
                  For LinkedIn, paste the job description text after clicking import.
                </p>
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
              <button
                onClick={onDismiss}
                className="text-sm text-neutral-400 underline-offset-2 hover:text-neutral-600 hover:underline dark:hover:text-neutral-300"
              >
                Skip for now and set up manually
              </button>
              <Link
                to="/job-os/companies"
                className="text-sm font-medium text-primary hover:underline"
              >
                Open manual setup
              </Link>
            </div>
          </section>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-2xl rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="mb-5 space-y-1">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Review extracted details
            </h2>
            <p className="text-sm text-neutral-500">
              Confirm what we found, then save to unlock Job OS, fit analysis, and CV tailoring from the same role context.
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

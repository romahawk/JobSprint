import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { ChevronDown, ChevronUp, CircleHelp, Loader2, Sparkles } from "lucide-react";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Label } from "../../app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../app/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../app/components/ui/tooltip";
import { useApp } from "../../app/context";
import { useJobOs } from "../../app/hooks/useJobOs";
import { JobOsLayout } from "../../app/components/job-os/JobOsLayout";
import type { CvTailoringMode, CvTailoringRun, JobDescription } from "../../app/types/jobOs";
import {
  analyzeFit,
  buildOptimizerSeed,
  CV_OPTIMIZER_PROMPTS,
  generateFullTailor,
  generateQuickTailor,
  type FitAnalysisResult,
  type FullTailorResult,
  type QuickTailorResult,
} from "../../services/cvOptimizerService";
import { isRemoteCvTailoringEnabled, requestRemoteCvTailoring } from "../../services/cvTailoringGateway";
import { FitAnalysisPanel } from "./FitAnalysisPanel";
import { JobDescriptionInput } from "./JobDescriptionInput";
import { PortfolioSuggestions } from "./PortfolioSuggestions";
import { TailoredOutputPanel } from "./TailoredOutputPanel";
import { TailoringHistoryList } from "./TailoringHistoryList";

const MODE_LABELS: Record<CvTailoringMode, string> = {
  analysis: "Fit Analysis",
  quickTailor: "Quick Tailor",
  fullTailor: "Full CV Tailor",
};

type OptimizerTask = "analysis" | "quickTailor" | "fullTailor" | "saveApplication" | null;

const TASK_STATUS_LABELS: Record<Exclude<OptimizerTask, null>, string> = {
  analysis: "Running fit analysis...",
  quickTailor: "Generating quick tailor...",
  fullTailor: "Tailoring the full CV with the selected asset...",
  saveApplication: "Saving tailored output to the application...",
};

function mapRoleTrackToProfile(track: string): "TPM" | "PO" | "Implementation" {
  if (track === "TPM") return "TPM";
  if (track === "Systems PM") return "Implementation";
  return "PO";
}

function findProfileForCv(
  cvId: string | null,
  cvs: ReturnType<typeof useJobOs>["assets"]["cvs"],
  cvProfiles: ReturnType<typeof useJobOs>["cvProfiles"]
) {
  const selectedCv = cvs.find((cv) => cv.id === cvId) ?? null;
  if (!selectedCv?.linkedProfileId) return null;
  return cvProfiles.find((profile) => profile.id === selectedCv.linkedProfileId) ?? null;
}

function findCvForTrack(
  track: "TPM" | "PO" | "Implementation",
  cvs: ReturnType<typeof useJobOs>["assets"]["cvs"],
  cvProfiles: ReturnType<typeof useJobOs>["cvProfiles"]
) {
  const matchingProfileIds = new Set(
    cvProfiles.filter((profile) => profile.targetTrack === track).map((profile) => profile.id)
  );
  return cvs.find((cv) => cv.linkedProfileId && matchingProfileIds.has(cv.linkedProfileId)) ?? null;
}

async function copyText(value: string): Promise<void> {
  if (!value) return;
  await navigator.clipboard.writeText(value);
}

function exportTextFile(fileName: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
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

export default function CvOptimizerPage() {
  const { session } = useApp();
  const {
    applications,
    companies,
    roles,
    assets,
    cvProfiles,
    jobDescriptions,
    cvTailoringRuns,
    addJobDescription,
    updateJobDescription,
    addCvTailoringRun,
    updateApplication,
    updateRole,
    syncNotice,
  } = useJobOs(session?.userId ?? null);
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const roleIdFromQuery = searchParams.get("roleId");
  const [isControlCenterExpanded, setIsControlCenterExpanded] = useState(true);

  const application = useMemo(
    () => applications.find((item) => item.id === applicationId) ?? null,
    [applicationId, applications]
  );
  const role = useMemo(() => {
    const resolvedRoleId = roleIdFromQuery || application?.roleId;
    return roles.find((item) => item.id === resolvedRoleId) ?? null;
  }, [application?.roleId, roleIdFromQuery, roles]);
  const company = useMemo(() => {
    const companyId = application?.companyId || role?.companyId;
    return companies.find((item) => item.id === companyId) ?? null;
  }, [application?.companyId, companies, role?.companyId]);
  const linkedJobDescription = useMemo(() => {
    const candidates = jobDescriptions.filter(
      (item) =>
        (application && item.applicationId === application.id) ||
        (role && item.roleId === role.id)
    );
    return candidates.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0] ?? null;
  }, [application, jobDescriptions, role]);

  const seed = useMemo(
    () => buildOptimizerSeed({ application, role, company, jobDescription: linkedJobDescription }),
    [application, company, linkedJobDescription, role]
  );
  const [selectedCvId, setSelectedCvId] = useState<string>(assets.cvs[0]?.id ?? "");
  const [mode, setMode] = useState<CvTailoringMode>("analysis");
  const [draft, setDraft] = useState<Pick<JobDescription, "applicationId" | "roleId" | "company" | "title" | "rawText" | "sourceUrl">>(seed);
  const [analysis, setAnalysis] = useState<FitAnalysisResult | null>(null);
  const [output, setOutput] = useState<QuickTailorResult | FullTailorResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<OptimizerTask>(null);

  useEffect(() => {
    setDraft(seed);
  }, [seed]);

  useEffect(() => {
    if (assets.cvs.length === 0) return;
    const hasCurrentSelection = assets.cvs.some((cv) => cv.id === selectedCvId);
    if (!hasCurrentSelection) {
      setSelectedCvId(assets.cvs[0].id);
    }
  }, [assets.cvs, selectedCvId]);

  const selectedCvAsset = assets.cvs.find((cv) => cv.id === selectedCvId) ?? assets.cvs[0] ?? null;
  const selectedProfile = findProfileForCv(selectedCvAsset?.id ?? null, assets.cvs, cvProfiles);
  const selectedCvText = selectedCvAsset?.sourceText?.trim() || undefined;

  useEffect(() => {
    if (assets.cvs.length === 0) return;
    const applicationMatch = application?.cvVersion
      ? assets.cvs.find((cv) => cv.name === application.cvVersion)
      : null;
    if (applicationMatch) {
      setSelectedCvId(applicationMatch.id);
      return;
    }
    if (!role) return;
    const preferredTrack = mapRoleTrackToProfile(role.track);
    const preferredCv = findCvForTrack(preferredTrack, assets.cvs, cvProfiles);
    if (preferredCv) {
      setSelectedCvId(preferredCv.id);
    }
  }, [application?.cvVersion, assets.cvs, cvProfiles, role]);

  const historyRuns = useMemo(() => {
    const filtered = cvTailoringRuns.filter((run) => {
      if (run.mode === "analysis") return false;
      if (application) return run.applicationId === application.id;
      if (linkedJobDescription) return run.jobDescriptionId === linkedJobDescription.id;
      return true;
    });
    return filtered.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)).slice(0, 3);
  }, [application, cvTailoringRuns, linkedJobDescription]);

  async function persistJobDescription(): Promise<string | null> {
    const payload: {
      applicationId?: string;
      roleId?: string;
      company: string;
      title: string;
      rawText: string;
      sourceUrl: string;
    } = {
      company: draft.company.trim(),
      title: draft.title.trim(),
      rawText: draft.rawText.trim(),
      sourceUrl: draft.sourceUrl.trim(),
    };

    if (application?.id) {
      payload.applicationId = application.id;
    }
    if (role?.id) {
      payload.roleId = role.id;
    }

    if (linkedJobDescription) {
      await updateJobDescription(linkedJobDescription.id, payload);
      return linkedJobDescription.id;
    }

    return addJobDescription(payload);
  }

  async function saveRun(
    runMode: CvTailoringMode,
    nextAnalysis: FitAnalysisResult,
    nextOutput?: QuickTailorResult | FullTailorResult | null
  ): Promise<string | null> {
    const jobDescriptionId = await persistJobDescription();
    if (role) {
      await updateRole(role.id, {
        jobDescription: draft.rawText.trim(),
        jobDescriptionUpdatedAt: new Date().toISOString(),
      });
    }
    if (!jobDescriptionId || !selectedProfile) {
      return null;
    }

    const runPayload: {
      applicationId?: string;
      jobDescriptionId: string;
      cvProfileId: string;
      mode: CvTailoringMode;
      fitScore?: number;
      extractedKeywords: string[];
      strengths: string[];
      gaps: string[];
      recruiterRisks: string[];
      recommendedPositioning?: string;
      tailoredHeadline?: string;
      tailoredSummary?: string;
      rewrittenBullets?: string[];
      portfolioRecommendations?: string[];
      finalCvText?: string;
    } = {
      jobDescriptionId,
      cvProfileId: selectedProfile.id,
      mode: runMode,
      fitScore: nextAnalysis.fitScore,
      extractedKeywords: nextAnalysis.keywords,
      strengths: nextAnalysis.strengths,
      gaps: nextAnalysis.gaps,
      recruiterRisks: nextAnalysis.recruiterRisks,
      portfolioRecommendations: nextOutput?.portfolioRecommendations ?? nextAnalysis.portfolioRecommendations,
    };

    if (application?.id) {
      runPayload.applicationId = application.id;
    }
    if (nextAnalysis.recommendedPositioning) {
      runPayload.recommendedPositioning = nextAnalysis.recommendedPositioning;
    }
    if (nextOutput?.headline) {
      runPayload.tailoredHeadline = nextOutput.headline;
    }
    if (nextOutput?.summary) {
      runPayload.tailoredSummary = nextOutput.summary;
    }
    if (nextOutput?.rewrittenBullets?.length) {
      runPayload.rewrittenBullets = nextOutput.rewrittenBullets;
    }
    if (nextOutput && "fullCvText" in nextOutput && nextOutput.fullCvText) {
      runPayload.finalCvText = nextOutput.fullCvText;
    }

    const runId = await addCvTailoringRun(runPayload);
    setCurrentRunId(runId);
    return runId;
  }

  async function resolveTailoringOutput(
    requestedMode: Extract<CvTailoringMode, "quickTailor" | "fullTailor">,
    nextAnalysis: FitAnalysisResult
  ): Promise<{ result: QuickTailorResult | FullTailorResult; remote: boolean }> {
    if (requestedMode === "fullTailor" && !selectedCvText) {
      throw new Error("Import the selected CV text in Assets Vault before running Full CV Tailor so JobSprint can preserve the real CV structure.");
    }

    if (selectedProfile && isRemoteCvTailoringEnabled()) {
      try {
        const remote = await requestRemoteCvTailoring({
          mode: requestedMode,
          cvName: selectedCvAsset?.name ?? "Selected CV",
          cvVersion: selectedCvAsset?.version,
          cvSourceText: selectedCvText,
          profile: selectedProfile,
          analysis: nextAnalysis,
          jobDescriptionText: draft.rawText,
          company: draft.company,
          roleTitle: draft.title,
        });

        if (remote) {
          if (requestedMode === "fullTailor") {
            return {
              result: {
                headline: remote.headline,
                summary: remote.summary,
                rewrittenBullets: remote.rewrittenBullets,
                portfolioRecommendations: remote.portfolioRecommendations,
                fullCvText: remote.fullCvText || generateFullTailor(selectedProfile, draft.rawText, selectedCvText).fullCvText,
                changedLineIndices: remote.changedLineIndices,
                changedWordSpans: remote.changedWordSpans,
              },
              remote: true,
            };
          }

          return {
            result: {
              headline: remote.headline,
              summary: remote.summary,
              rewrittenBullets: remote.rewrittenBullets,
              portfolioRecommendations: remote.portfolioRecommendations,
            },
            remote: true,
          };
        }
      } catch {
        // Fall back to the local deterministic transformer when the remote endpoint is unavailable.
      }
    }

    return {
      result:
        requestedMode === "fullTailor"
          ? generateFullTailor(selectedProfile!, draft.rawText, selectedCvText)
          : generateQuickTailor(selectedProfile!, draft.rawText, selectedCvText),
      remote: false,
    };
  }

  async function handleRunAnalysis(): Promise<void> {
    if (!selectedProfile || !draft.rawText.trim()) {
      setStatusMessage("Choose a CV with a linked profile in Assets and add a job description before running analysis.");
      return;
    }

    setActiveTask("analysis");
    setStatusMessage(TASK_STATUS_LABELS.analysis);
    try {
      const nextAnalysis = analyzeFit(selectedProfile, draft.rawText, selectedCvText);
      setMode("analysis");
      setAnalysis(nextAnalysis);
      setOutput(null);
      setStatusMessage("Fit analysis completed. This score is a local heuristic estimate and is not an LLM response.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Fit analysis could not be completed.");
    } finally {
      setActiveTask(null);
    }
  }

  async function handleRunTailoring(requestedMode: Extract<CvTailoringMode, "quickTailor" | "fullTailor">): Promise<void> {
    if (!selectedProfile || !draft.rawText.trim()) {
      setStatusMessage("Choose a CV with a linked profile in Assets and add a job description before tailoring.");
      return;
    }

    setActiveTask(requestedMode);
    setStatusMessage(TASK_STATUS_LABELS[requestedMode]);
    try {
      const baseAnalysis = analyzeFit(selectedProfile, draft.rawText, selectedCvText);
      const { result, remote } = await resolveTailoringOutput(requestedMode, baseAnalysis);
      const nextAnalysis =
        requestedMode === "fullTailor" && "fullCvText" in result
          ? analyzeFit(selectedProfile, draft.rawText, result.fullCvText)
          : baseAnalysis;

      setMode(requestedMode);
      setAnalysis(nextAnalysis);
      setOutput(result);
      await saveRun(requestedMode, nextAnalysis, result);
      setStatusMessage(
        remote
          ? requestedMode === "fullTailor"
            ? `${MODE_LABELS[requestedMode]} generated via remote AI tailoring, fit score refreshed from the tailored CV, and the run was saved.`
            : `${MODE_LABELS[requestedMode]} generated via remote AI tailoring and saved.`
          : requestedMode === "fullTailor"
            ? `${MODE_LABELS[requestedMode]} generated from your saved CV asset, fit score refreshed from the tailored CV, and the run was saved.`
            : `${MODE_LABELS[requestedMode]} generated from your saved CV asset and saved.`
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Tailoring could not be completed.");
    } finally {
      setActiveTask(null);
    }
  }

  async function handleSaveToApplication(): Promise<void> {
    if (!application || !output) {
      setStatusMessage("Open the optimizer from an application row to save the tailored CV back to that application.");
      return;
    }

    setActiveTask("saveApplication");
    setStatusMessage(TASK_STATUS_LABELS.saveApplication);
    try {
      await updateApplication(application.id, {
        latestJobDescriptionId: linkedJobDescription?.id,
        latestCvTailoringRunId: currentRunId ?? undefined,
        tailoredCvHeadline: output.headline,
        tailoredCvSummary: output.summary,
        tailoredCvText: "fullCvText" in output ? output.fullCvText : output.rewrittenBullets.join("\n"),
        tailoredCvUpdatedAt: new Date().toISOString(),
      });
      setStatusMessage("Tailored CV content saved to the application record.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "The tailored CV could not be saved to the application.");
    } finally {
      setActiveTask(null);
    }
  }

  function handleReuseRun(run: CvTailoringRun): void {
    const historicalJobDescription = jobDescriptions.find((item) => item.id === run.jobDescriptionId);
    if (historicalJobDescription) {
      setDraft({
        applicationId: historicalJobDescription.applicationId,
        roleId: historicalJobDescription.roleId,
        company: historicalJobDescription.company,
        title: historicalJobDescription.title,
        rawText: historicalJobDescription.rawText,
        sourceUrl: historicalJobDescription.sourceUrl ?? "",
      });
    }
    const linkedCv = assets.cvs.find((cv) => cv.linkedProfileId === run.cvProfileId) ?? null;
    if (linkedCv) {
      setSelectedCvId(linkedCv.id);
    } else {
      const runProfile = cvProfiles.find((profile) => profile.id === run.cvProfileId) ?? null;
      const fallbackCv = runProfile
        ? findCvForTrack(runProfile.targetTrack, assets.cvs, cvProfiles)
        : null;
      if (fallbackCv) {
        setSelectedCvId(fallbackCv.id);
      }
    }
    setAnalysis({
      fitScore: run.fitScore ?? 0,
      keywords: run.extractedKeywords,
      strengths: run.strengths,
      gaps: run.gaps,
      recruiterRisks: run.recruiterRisks,
      recommendedPositioning: run.recommendedPositioning ?? "",
      portfolioRecommendations: run.portfolioRecommendations ?? [],
    });
    setOutput(
      run.finalCvText
        ? {
            headline: run.tailoredHeadline ?? "",
            summary: run.tailoredSummary ?? "",
            rewrittenBullets: run.rewrittenBullets ?? [],
            portfolioRecommendations: run.portfolioRecommendations ?? [],
            fullCvText: run.finalCvText,
          }
        : {
            headline: run.tailoredHeadline ?? "",
            summary: run.tailoredSummary ?? "",
            rewrittenBullets: run.rewrittenBullets ?? [],
            portfolioRecommendations: run.portfolioRecommendations ?? [],
          }
    );
    setCurrentRunId(run.id);
    setMode(run.mode);
    setStatusMessage("Loaded a saved tailored run.");
  }

  const portfolioRecommendations = output?.portfolioRecommendations ?? analysis?.portfolioRecommendations ?? [];
  const exportContent = output
    ? "fullCvText" in output
      ? output.fullCvText
      : [output.headline, "", output.summary, "", ...(output.rewrittenBullets ?? [])].join("\n")
    : "";
  const isBusy = activeTask !== null;
  const activeStatusLabel = activeTask ? TASK_STATUS_LABELS[activeTask] : "";

  return (
    <JobOsLayout
      title="CV Optimizer"
      subtitle="Tailor a base CV to a specific role, save the result, and keep it linked to roles and applications."
      notice={syncNotice || statusMessage}
      actions={
        role?.url ? (
          <Button size="sm" variant="secondary" onClick={() => window.open(role.url, "_blank", "noopener,noreferrer")}>
            Open role URL
          </Button>
        ) : null
      }
    >
      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)] xl:items-start">
        <aside className="space-y-4 xl:sticky xl:top-20">
          <JobDescriptionInput
            company={draft.company}
            title={draft.title}
            sourceUrl={draft.sourceUrl ?? ""}
            rawText={draft.rawText}
            onChange={(field, value) => setDraft((current) => ({ ...current, [field]: value }))}
            roleHint={
              role
                ? `Linked role: ${role.title}. The stored role URL is available here; for reliability, paste or maintain the job description text in JobSprint because direct browser scraping from third-party job boards is not guaranteed.`
                : "Paste a job description or open this page from a role/application to prefill context."
            }
          />

          <Card className="overflow-hidden border-brand-blue/15 bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-neutral-950 dark:via-neutral-950 dark:to-slate-900">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-sm">Control Center</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pick the base CV, verify the linked profile, and run analysis or tailoring from one compact rail.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsControlCenterExpanded((current) => !current)}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/60 dark:hover:bg-neutral-900"
                  aria-expanded={isControlCenterExpanded}
                >
                  {isControlCenterExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {isControlCenterExpanded ? "Collapse" : "Expand"}
                </button>
              </div>
            </CardHeader>
            {isControlCenterExpanded ? (
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label>Comparison CV</Label>
                <Select value={selectedCvAsset?.id ?? ""} onValueChange={setSelectedCvId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a CV source" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.cvs.map((cv) => (
                      <SelectItem key={cv.id} value={cv.id}>
                        {cv.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-xl border border-border bg-white/70 p-4 dark:bg-neutral-950/40">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Selected CV Source</div>
                  <div className="mt-2 text-sm font-medium text-foreground">{selectedCvAsset?.name || "No CV selected"}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {selectedCvAsset?.version ? `Version ${selectedCvAsset.version}` : "Version not set"}
                    {application?.cvVersion === selectedCvAsset?.name ? " - matched from application" : ""}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{selectedCvText ? "Snapshot ready" : "Snapshot missing"}</span>
                    <InlineInfoTip
                      label={selectedCvText
                        ? "A text snapshot is available, so JobSprint can tailor the actual CV body while preserving the base structure from Assets."
                        : "No text snapshot is attached yet. Import or paste the CV text in Assets Vault before running Full CV Tailor."}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-white/70 p-4 dark:bg-neutral-950/40">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Linked Profile</div>
                  <div className="mt-2 text-sm font-medium text-foreground">
                    {selectedProfile?.headline || selectedProfile?.name || "No linked profile"}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {selectedProfile
                      ? `${selectedProfile.name} - ${selectedProfile.targetTrack} track`
                      : "This CV does not have a linked profile in Assets yet."}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{selectedProfile?.summary ? "Profile guidance linked" : "Profile guidance missing"}</span>
                    <InlineInfoTip
                      label={selectedProfile?.summary || "Link a profile to this CV in Assets Vault if you want the optimizer to use structured positioning, skills, and experience guidance."}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                <span>Asset CV base + live AI tailor</span>
                <InlineInfoTip label="Full CV Tailor uses the selected Asset CV as the base document. Live AI tailoring runs through the backend; fit analysis remains a local heuristic estimate." />
              </div>

              <div className="rounded-2xl border border-brand-blue/20 bg-brand-blue/5 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-brand-blue" />
                  Run Controls
                </div>
                <div className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <Label>Mode</Label>
                    <Select value={mode} onValueChange={(value) => setMode(value as CvTailoringMode)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="analysis">Fit Analysis</SelectItem>
                        <SelectItem value="quickTailor">Quick Tailor</SelectItem>
                        <SelectItem value="fullTailor">Full CV Tailor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                    <Button onClick={() => void handleRunAnalysis()} disabled={isBusy}>
                      {activeTask === "analysis" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Run analysis
                    </Button>
                    <Button variant="secondary" onClick={() => void handleRunTailoring("quickTailor")} disabled={isBusy}>
                      {activeTask === "quickTailor" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Run quick tailor
                    </Button>
                    <Button variant="outline" onClick={() => void handleRunTailoring("fullTailor")} disabled={isBusy}>
                      {activeTask === "fullTailor" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Run full tailor
                    </Button>
                  </div>
                  {isBusy ? (
                    <div className="flex items-center gap-2 rounded-xl border border-brand-blue/20 bg-white/60 px-3 py-3 text-sm text-foreground dark:bg-neutral-950/40">
                      <Loader2 className="h-4 w-4 animate-spin text-brand-blue" />
                      <span>{activeStatusLabel}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-white/40 px-3 py-3 text-xs text-muted-foreground dark:bg-neutral-950/20">
                    <span className="font-semibold text-foreground">Prompt structure</span>
                    <InlineInfoTip label={CV_OPTIMIZER_PROMPTS[mode]} />
                  </div>
                </div>
              </div>
            </CardContent>
            ) : null}
          </Card>


        </aside>

        <section className="min-w-0 grid gap-4 2xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] 2xl:items-start">
          <div className="space-y-4">
            <FitAnalysisPanel analysis={analysis} />
            <PortfolioSuggestions projects={portfolioRecommendations} />
          <TailoringHistoryList runs={historyRuns} onReuse={handleReuseRun} />
          </div>

          <TailoredOutputPanel
            mode={mode}
            output={output}
            originalCvText={selectedCvText ?? ""}
            onCopySummary={() => void copyText(output?.summary ?? "")}
            onCopyBullets={() => void copyText((output?.rewrittenBullets ?? []).join("\n"))}
            onCopyFullCv={() => void copyText(output && "fullCvText" in output ? output.fullCvText : exportContent)}
            onSaveToApplication={() => void handleSaveToApplication()}
            onExport={() => exportTextFile(`${draft.company || "tailored-cv"}.txt`, exportContent)}
            saveDisabled={!application || isBusy}
            isBusy={isBusy}
            busyLabel={activeStatusLabel}
          />
        </section>
      </div>
    </JobOsLayout>
  );
}



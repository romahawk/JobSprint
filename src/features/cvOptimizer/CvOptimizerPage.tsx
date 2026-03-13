import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Label } from "../../app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../app/components/ui/select";
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

function mapRoleTrackToProfile(track: string): "TPM" | "PO" | "Implementation" {
  if (track === "TPM") return "TPM";
  if (track === "Systems PM") return "Implementation";
  return "PO";
}

function defaultCvNameForTrack(track: "TPM" | "PO" | "Implementation"): string {
  if (track === "TPM") return "CV - Technical Product Manager";
  if (track === "Implementation") return "CV - Systems / Platform PM";
  return "CV - Product Engineer";
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
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [selectedCvName, setSelectedCvName] = useState<string>(assets.cvs[0]?.name ?? "");
  const [mode, setMode] = useState<CvTailoringMode>("analysis");
  const [draft, setDraft] = useState<Pick<JobDescription, "applicationId" | "roleId" | "company" | "title" | "rawText" | "sourceUrl">>(seed);
  const [analysis, setAnalysis] = useState<FitAnalysisResult | null>(null);
  const [output, setOutput] = useState<QuickTailorResult | FullTailorResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  useEffect(() => {
    setDraft(seed);
  }, [seed]);

  useEffect(() => {
    if (cvProfiles.length === 0) return;
    const hasCurrentSelection = cvProfiles.some((profile) => profile.id === selectedProfileId);
    if (!hasCurrentSelection) {
      setSelectedProfileId(cvProfiles[0].id);
    }
  }, [cvProfiles, selectedProfileId]);

  useEffect(() => {
    if (assets.cvs.length === 0) return;
    const hasCurrentSelection = assets.cvs.some((cv) => cv.name === selectedCvName);
    if (!hasCurrentSelection) {
      setSelectedCvName(assets.cvs[0].name);
    }
  }, [assets.cvs, selectedCvName]);

  const selectedProfile = cvProfiles.find((profile) => profile.id === selectedProfileId) ?? cvProfiles[0] ?? null;
  const selectedCvAsset = assets.cvs.find((cv) => cv.name === selectedCvName) ?? assets.cvs[0] ?? null;
  const selectedCvText = selectedCvAsset?.sourceText?.trim() || undefined;

  useEffect(() => {
    if (selectedCvAsset?.linkedProfileId && cvProfiles.some((profile) => profile.id === selectedCvAsset.linkedProfileId)) {
      setSelectedProfileId(selectedCvAsset.linkedProfileId);
      return;
    }
    if (!role || cvProfiles.length === 0) return;
    const preferredTrack = mapRoleTrackToProfile(role.track);
    const preferredProfile = cvProfiles.find((profile) => profile.targetTrack === preferredTrack);
    if (preferredProfile) {
      setSelectedProfileId(preferredProfile.id);
    }
  }, [cvProfiles, role, selectedCvAsset]);

  useEffect(() => {
    if (!role) return;
    const preferredTrack = mapRoleTrackToProfile(role.track);
    const preferredCvName = application?.cvVersion || defaultCvNameForTrack(preferredTrack);
    if (assets.cvs.some((cv) => cv.name === preferredCvName)) {
      setSelectedCvName(preferredCvName);
    }
  }, [application?.cvVersion, assets.cvs, role]);
  const historyRuns = useMemo(() => {
    const filtered = cvTailoringRuns.filter((run) => {
      if (application) return run.applicationId === application.id;
      if (linkedJobDescription) return run.jobDescriptionId === linkedJobDescription.id;
      return true;
    });
    return filtered.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)).slice(0, 8);
  }, [application, cvTailoringRuns, linkedJobDescription]);

  async function persistJobDescription(): Promise<string | null> {
    const payload = {
      applicationId: application?.id,
      roleId: role?.id,
      company: draft.company.trim(),
      title: draft.title.trim(),
      rawText: draft.rawText.trim(),
      sourceUrl: draft.sourceUrl.trim(),
    };

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

    const runId = await addCvTailoringRun({
      applicationId: application?.id,
      jobDescriptionId,
      cvProfileId: selectedProfile.id,
      mode: runMode,
      fitScore: nextAnalysis.fitScore,
      extractedKeywords: nextAnalysis.keywords,
      strengths: nextAnalysis.strengths,
      gaps: nextAnalysis.gaps,
      recruiterRisks: nextAnalysis.recruiterRisks,
      recommendedPositioning: nextAnalysis.recommendedPositioning,
      tailoredHeadline: nextOutput?.headline,
      tailoredSummary: nextOutput?.summary,
      rewrittenBullets: nextOutput?.rewrittenBullets,
      portfolioRecommendations: nextOutput?.portfolioRecommendations ?? nextAnalysis.portfolioRecommendations,
      finalCvText: nextOutput && "fullCvText" in nextOutput ? nextOutput.fullCvText : undefined,
    });
    setCurrentRunId(runId);
    return runId;
  }

  async function handleRunAnalysis(): Promise<void> {
    if (!selectedProfile || !draft.rawText.trim()) {
      setStatusMessage("Add a base CV profile and job description before running analysis.");
      return;
    }
    const nextAnalysis = analyzeFit(selectedProfile, draft.rawText, selectedCvText);
    setAnalysis(nextAnalysis);
    setOutput(null);
    await saveRun("analysis", nextAnalysis, null);
    setStatusMessage("Fit analysis saved to history.");
  }

  async function handleRunTailoring(requestedMode: CvTailoringMode): Promise<void> {
    if (!selectedProfile || !draft.rawText.trim()) {
      setStatusMessage("Add a base CV profile and job description before tailoring.");
      return;
    }
    const nextAnalysis = analyzeFit(selectedProfile, draft.rawText, selectedCvText);
    const nextOutput = requestedMode === "fullTailor"
      ? generateFullTailor(selectedProfile, draft.rawText, selectedCvText)
      : generateQuickTailor(selectedProfile, draft.rawText, selectedCvText);
    setMode(requestedMode);
    setAnalysis(nextAnalysis);
    setOutput(nextOutput);
    await saveRun(requestedMode, nextAnalysis, nextOutput);
    setStatusMessage(`${MODE_LABELS[requestedMode]} generated and saved.`);
  }

  async function handleSaveToApplication(): Promise<void> {
    if (!application || !output) {
      setStatusMessage("Open the optimizer from an application row to save the tailored CV back to that application.");
      return;
    }
    await updateApplication(application.id, {
      latestJobDescriptionId: linkedJobDescription?.id,
      latestCvTailoringRunId: currentRunId ?? undefined,
      tailoredCvHeadline: output.headline,
      tailoredCvSummary: output.summary,
      tailoredCvText: "fullCvText" in output ? output.fullCvText : output.rewrittenBullets.join("\n"),
      tailoredCvUpdatedAt: new Date().toISOString(),
    });
    setStatusMessage("Tailored CV content saved to the application record.");
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
    setSelectedProfileId(run.cvProfileId);
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
      run.mode === "analysis"
        ? null
        : run.finalCvText
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
    setStatusMessage("Loaded saved tailoring run.");
  }

  const portfolioRecommendations = output?.portfolioRecommendations ?? analysis?.portfolioRecommendations ?? [];
  const exportContent = output
    ? "fullCvText" in output
      ? output.fullCvText
      : [output.headline, "", output.summary, "", ...(output.rewrittenBullets ?? [])].join("\n")
    : "";

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
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_1fr]">
        <div className="space-y-4">
          <Card className="overflow-hidden border-brand-blue/15 bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-neutral-950 dark:via-neutral-950 dark:to-slate-900">
            <CardHeader>
              <CardTitle className="text-sm">CV Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Base profile</Label>
                  <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a base profile" />
                    </SelectTrigger>
                    <SelectContent>
                      {cvProfiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Comparison CV</Label>
                  <Select value={selectedCvName} onValueChange={setSelectedCvName}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a CV source" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.cvs.map((cv) => (
                        <SelectItem key={cv.id} value={cv.name}>
                          {cv.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-white/70 p-4 dark:bg-neutral-950/40">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Selected Profile</div>
                  <div className="mt-2 text-sm font-medium text-foreground">
                    {selectedProfile?.headline || selectedProfile?.name || "No profile available"}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {selectedProfile ? `${selectedProfile.targetTrack} track${selectedCvAsset?.linkedProfileId === selectedProfile.id ? " · linked from this CV" : ""}` : "Default profiles are loading from JobSprint storage."}
                  </div>
                  <div className="mt-3 text-sm leading-6 text-muted-foreground">
                    {selectedProfile?.summary || "This base profile provides the headline, summary, skills, and experience structure for tailoring."}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-white/70 p-4 dark:bg-neutral-950/40">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Selected CV Source</div>
                  <div className="mt-2 text-sm font-medium text-foreground">{selectedCvAsset?.name || "No CV selected"}</div>
                  <div className="mt-3 text-sm leading-6 text-muted-foreground">
                    {selectedCvText
                      ? "A text snapshot is available, so fit analysis will compare the job description against your latest saved CV text first and then use the selected profile as structure."
                      : "No text snapshot is attached yet, so the optimizer will fall back to the linked profile. Paste or import the latest CV text in Assets Vault for more accurate comparisons."}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                The fit analysis compares the selected CV source against the pasted or synced job description. Role and application data are only used to prefill company, title, URL, and saved JD text.
              </div>
            </CardContent>
          </Card>

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
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Run Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void handleRunAnalysis()}>Run analysis</Button>
                <Button variant="secondary" onClick={() => void handleRunTailoring("quickTailor")}>Run quick tailor</Button>
                <Button variant="outline" onClick={() => void handleRunTailoring("fullTailor")}>Run full tailor</Button>
              </div>
              <div className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
                <div className="font-semibold text-foreground">Prompt structure ready for future model integration</div>
                <div className="mt-1">{CV_OPTIMIZER_PROMPTS[mode]}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <FitAnalysisPanel analysis={analysis} />
          <PortfolioSuggestions projects={portfolioRecommendations} />
        </div>

        <div className="space-y-4">
          <TailoredOutputPanel
            mode={mode}
            output={output}
            onCopySummary={() => void copyText(output?.summary ?? "")}
            onCopyBullets={() => void copyText((output?.rewrittenBullets ?? []).join("\n"))}
            onCopyFullCv={() => void copyText(output && "fullCvText" in output ? output.fullCvText : exportContent)}
            onSaveToApplication={() => void handleSaveToApplication()}
            onExport={() => exportTextFile(`${draft.company || "tailored-cv"}.txt`, exportContent)}
            saveDisabled={!application}
          />
          <TailoringHistoryList runs={historyRuns} onReuse={handleReuseRun} />
        </div>
      </div>
    </JobOsLayout>
  );
}



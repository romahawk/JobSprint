import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type {
  NormalizedImportResult,
  NormalizedCompanyDraft,
  NormalizedRoleDraft,
  ImportMode,
} from "../../services/ingestion/types";
import type {
  AiImportCompanySizeBand,
  AiImportCompanyStage,
  AiImportFieldConfidence,
  AiImportNextBestAction,
  AiImportReviewFlag,
  AiImportSeniority,
  CompanyPriority,
  CompanyStatus,
  JobTrack,
  RoleStatus,
} from "../../types/jobOs";
import { ImportConfidenceBadge } from "./ImportConfidenceBadge";
import { DuplicateMatchAlert } from "./DuplicateMatchAlert";

const COMPANY_STATUSES: CompanyStatus[] = [
  "Research",
  "Target",
  "Active",
  "Applied",
  "Interviewing",
  "Closed",
];

const ROLE_STATUSES: RoleStatus[] = [
  "to_apply",
  "applied",
  "interview",
  "rejected",
  "offer",
  "closed",
];

const TRACKS: JobTrack[] = ["TPM", "Product Engineer", "Systems PM"];
const SENIORITY_OPTIONS: AiImportSeniority[] = [
  "Junior",
  "Middle",
  "Senior",
  "Lead",
  "Staff",
  "Principal",
  "Director",
  "VP",
  "Executive",
  "Unknown",
];
const COMPANY_SIZE_BANDS: AiImportCompanySizeBand[] = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5000+",
  "Unknown",
];
const COMPANY_STAGES: AiImportCompanyStage[] = [
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+",
  "Private Growth",
  "Bootstrapped",
  "Public",
  "Enterprise",
  "Unknown",
];
const NEXT_BEST_ACTIONS: AiImportNextBestAction[] = [
  "Research",
  "Tailor CV",
  "Apply",
  "Follow up",
  "Network",
  "Archive",
];
const FIT_SCORES: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5];

interface PasteLinkReviewStepProps {
  result: NormalizedImportResult;
  defaultMode: ImportMode;
  onContinue: (
    companyDraft: NormalizedCompanyDraft,
    roleDraft: NormalizedRoleDraft | undefined,
    mode: ImportMode,
    updateExistingId?: string
  ) => void;
  onBack: () => void;
  onCancel: () => void;
}

export function PasteLinkReviewStep({
  result,
  defaultMode,
  onContinue,
  onBack,
  onCancel,
}: PasteLinkReviewStepProps) {
  const [mode, setMode] = useState<ImportMode>(defaultMode);
  const [company, setCompany] = useState<NormalizedCompanyDraft>(result.company);
  const [role, setRole] = useState<NormalizedRoleDraft | undefined>(result.role);
  const [duplicateAction, setDuplicateAction] = useState<"update" | "create_new">(
    "update"
  );

  function setC<K extends keyof NormalizedCompanyDraft>(
    key: K,
    value: NormalizedCompanyDraft[K]
  ) {
    setCompany((prev) => ({ ...prev, [key]: value }));
  }

  function setR<K extends keyof NormalizedRoleDraft>(
    key: K,
    value: NormalizedRoleDraft[K]
  ) {
    setRole((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function setCompanyAiField(
    field: "industry" | "sizeBand" | "companyStage",
    value: string
  ) {
    setCompany((prev) => ({
      ...prev,
      aiEnrichment: {
        ...prev.aiEnrichment,
        schemaVersion: prev.aiEnrichment?.schemaVersion ?? "ai_import_v1",
        enriched: {
          ...prev.aiEnrichment?.enriched,
          company: {
            ...prev.aiEnrichment?.enriched?.company,
            [field]: value,
          },
        },
      },
    }));
  }

  function setRoleAiField(
    field: "track" | "seniority" | "nextBestAction",
    value: string
  ) {
    setRole((prev) =>
      prev
        ? {
            ...prev,
            aiEnrichment: {
              ...prev.aiEnrichment,
              schemaVersion: prev.aiEnrichment?.schemaVersion ?? "ai_import_v1",
              enriched: {
                ...prev.aiEnrichment?.enriched,
                role: {
                  ...prev.aiEnrichment?.enriched?.role,
                  [field]: value,
                },
              },
            },
          }
        : prev
    );
  }

  function handleContinue(includeRole: boolean) {
    const updateId =
      result.duplicateMatch && duplicateAction === "update"
        ? result.duplicateMatch.companyId
        : undefined;

    onContinue(
      company,
      includeRole ? role : undefined,
      includeRole ? "company_and_role" : "company_only",
      updateId
    );
  }

  const hasRole = !!role;
  const showRoleFields = mode === "company_and_role" && hasRole;
  const activeAi = role?.aiEnrichment ?? company.aiEnrichment ?? result.aiEnrichment;
  const aiReviewFlags = activeAi?.reviewFlags ?? [];
  const aiModel = activeAi?.model;
  const roleConfidence = activeAi?.confidence?.fields ?? {};
  const companyStage =
    company.aiEnrichment?.enriched?.company?.companyStage ?? "Unknown";
  const companySizeBand =
    company.aiEnrichment?.enriched?.company?.sizeBand ?? "Unknown";
  const aiIndustry =
    company.aiEnrichment?.enriched?.company?.industry ?? "Unknown";
  const aiRoleTrack =
    role?.aiEnrichment?.enriched?.role?.track ?? "Unknown";
  const aiSeniority =
    role?.aiEnrichment?.enriched?.role?.seniority ?? "Unknown";
  const aiNextBestAction =
    role?.aiEnrichment?.enriched?.role?.nextBestAction ?? "Research";

  return (
    <div className="space-y-5">
      <ImportConfidenceBadge
        confidence={result.confidence}
        platform={result.sourcePlatform}
      />

      {result.aiEnrichment && (
        <div className="rounded border border-blue-200 dark:border-blue-900/50 bg-blue-50/80 dark:bg-blue-950/20 px-3 py-2 space-y-1">
          <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
            AI enrichment applied
          </div>
          <div className="text-xs text-blue-700/90 dark:text-blue-300/80">
            Review is prefilled with structured suggestions for role classification and next-step planning.
            {aiModel ? ` Model: ${aiModel}.` : ""}
            {aiReviewFlags.length > 0
              ? ` ${aiReviewFlags.length} item${aiReviewFlags.length === 1 ? "" : "s"} flagged for review.`
              : ""}
          </div>
        </div>
      )}

      {result.duplicateMatch && (
        <DuplicateMatchAlert
          existingCompanyName={result.duplicateMatch.companyName}
          selectedAction={duplicateAction}
          onUpdateExisting={() => setDuplicateAction("update")}
          onCreateNew={() => setDuplicateAction("create_new")}
        />
      )}

      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold border-b pb-1">Extracted from source</h3>
          <p className="text-xs text-muted-foreground">
            Confirm the facts pulled from the job page or pasted description.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="rv-name">Company Name *</Label>
            <Input
              id="rv-name"
              value={company.name}
              onChange={(event) => setC("name", event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rv-website">Website</Label>
            <Input
              id="rv-website"
              value={company.website ?? ""}
              onChange={(event) => setC("website", event.target.value || undefined)}
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rv-careers">Careers URL</Label>
            <Input
              id="rv-careers"
              value={company.careersUrl ?? ""}
              onChange={(event) => setC("careersUrl", event.target.value || undefined)}
              placeholder="https://example.com/careers"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rv-location">Location</Label>
            <Input
              id="rv-location"
              value={company.location ?? ""}
              onChange={(event) => setC("location", event.target.value || undefined)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rv-remote">Remote Policy</Label>
            <Input
              id="rv-remote"
              value={company.remotePolicy}
              onChange={(event) => setC("remotePolicy", event.target.value)}
              placeholder="Remote / Hybrid / On-site"
            />
          </div>

          <div className="space-y-1.5">
            <Label>English-First</Label>
            <Select
              value={company.englishFirst ?? "Unknown"}
              onValueChange={(value) => setC("englishFirst", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="Mostly">Mostly</SelectItem>
                <SelectItem value="Unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select
              value={company.priority}
              onValueChange={(value) => setC("priority", value as CompanyPriority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={company.status}
              onValueChange={(value) => setC("status", value as CompanyStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rv-notes">Notes</Label>
          <Textarea
            id="rv-notes"
            value={company.notes}
            onChange={(event) => setC("notes", event.target.value)}
            rows={3}
          />
        </div>
      </section>

      {hasRole && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b pb-1">
            <h3 className="text-sm font-semibold">Extracted role facts</h3>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="review-import-mode"
                  value="company_only"
                  checked={mode === "company_only"}
                  onChange={() => setMode("company_only")}
                  className="accent-primary"
                />
                Company only
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="review-import-mode"
                  value="company_and_role"
                  checked={mode === "company_and_role"}
                  onChange={() => setMode("company_and_role")}
                  className="accent-primary"
                />
                Include role
              </label>
            </div>
          </div>

          {showRoleFields && role && (
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rv-role-title">Title</Label>
                <Input
                  id="rv-role-title"
                  value={role.title}
                  onChange={(event) => setR("title", event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rv-role-url">Role URL</Label>
                <Input
                  id="rv-role-url"
                  value={role.url}
                  onChange={(event) => setR("url", event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rv-role-location">Location</Label>
                <Input
                  id="rv-role-location"
                  value={role.location}
                  onChange={(event) => setR("location", event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rv-seniority">Seniority</Label>
                <Input
                  id="rv-seniority"
                  value={role.seniority}
                  onChange={(event) => setR("seniority", event.target.value)}
                />
              </div>

              {role.jobDescription && (
                <div className="md:col-span-2 space-y-1.5">
                  <Label>Job Description Preview</Label>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 rounded border p-2 max-h-32 overflow-y-auto whitespace-pre-wrap bg-neutral-50 dark:bg-neutral-900">
                    {role.jobDescription.slice(0, 600)}
                    {role.jobDescription.length > 600 && "..."}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold border-b pb-1">AI inferred / recommended</h3>
          <p className="text-xs text-muted-foreground">
            These suggestions are editable and can help route the import into the right workflow faster.
          </p>
        </div>

        {activeAi ? (
          <>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel
                  label="Industry"
                  confidence={roleConfidence.industry}
                />
                <Input
                  value={company.industry}
                  onChange={(event) => {
                    setC("industry", event.target.value);
                    setCompanyAiField("industry", event.target.value);
                  }}
                  placeholder={aiIndustry !== "Unknown" ? aiIndustry : "Industry"}
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabel
                  label="Company size band"
                  confidence={roleConfidence.companySizeBand}
                />
                <Select
                  value={companySizeBand}
                  onValueChange={(value) => {
                    setC("size", value === "Unknown" ? "" : value);
                    setCompanyAiField("sizeBand", value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZE_BANDS.map((band) => (
                      <SelectItem key={band} value={band}>
                        {band}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FieldLabel
                  label="Company stage"
                  confidence={roleConfidence.companyStage}
                />
                <Select
                  value={companyStage}
                  onValueChange={(value) => setCompanyAiField("companyStage", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FieldLabel
                  label="Priority band"
                  confidence={roleConfidence.priorityBand}
                />
                <Select
                  value={company.priority}
                  onValueChange={(value) => setC("priority", value as CompanyPriority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showRoleFields && role && (
                <>
                  <div className="space-y-1.5">
                    <FieldLabel
                      label="Role track"
                      confidence={roleConfidence.roleTrack}
                    />
                    <Select
                      value={role.track}
                      onValueChange={(value) => {
                        setR("track", value as JobTrack);
                        setRoleAiField("track", value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRACKS.map((track) => (
                          <SelectItem key={track} value={track}>
                            {track}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {aiRoleTrack !== "Unknown" && (
                      <p className="text-[11px] text-muted-foreground">
                        AI suggested: {aiRoleTrack}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <FieldLabel
                      label="Seniority"
                      confidence={roleConfidence.seniority}
                    />
                    <Select
                      value={aiSeniority}
                      onValueChange={(value) => {
                        setR("seniority", value === "Middle" ? "Mid" : value);
                        setRoleAiField("seniority", value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SENIORITY_OPTIONS.map((seniority) => (
                          <SelectItem key={seniority} value={seniority}>
                            {seniority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <FieldLabel
                      label="Fit score"
                      confidence={roleConfidence.fitScore}
                    />
                    <Select
                      value={String(role.fitScore)}
                      onValueChange={(value) => setR("fitScore", Number(value) as 1 | 2 | 3 | 4 | 5)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIT_SCORES.map((score) => (
                          <SelectItem key={score} value={String(score)}>
                            {score}/5
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Role Status</Label>
                    <Select
                      value={role.status}
                      onValueChange={(value) => setR("status", value as RoleStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <FieldLabel
                      label="Next best action"
                      confidence={roleConfidence.nextBestAction}
                    />
                    <Select
                      value={role.nextAction?.trim() || aiNextBestAction}
                      onValueChange={(value) => {
                        setR("nextAction", value);
                        setRoleAiField("nextBestAction", value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NEXT_BEST_ACTIONS.map((action) => (
                          <SelectItem key={action} value={action}>
                            {action}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {aiReviewFlags.length > 0 && (
              <div className="rounded border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 px-3 py-3 space-y-2">
                <div className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  Review flags
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiReviewFlags.map((flag) => (
                    <ReviewFlagChip key={`${flag.code}-${flag.fieldPath ?? ""}`} flag={flag} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded border border-dashed px-3 py-3 text-sm text-muted-foreground">
            AI enrichment was not available for this import, so review is showing source-derived data only.
          </div>
        )}
      </section>

      <div className="flex gap-2 justify-end pt-2 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        {mode === "company_and_role" && hasRole ? (
          <Button onClick={() => handleContinue(true)} disabled={!company.name.trim()}>
            Continue
          </Button>
        ) : (
          <Button onClick={() => handleContinue(false)} disabled={!company.name.trim()}>
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}

function FieldLabel({
  label,
  confidence,
}: {
  label: string;
  confidence?: AiImportFieldConfidence;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label>{label}</Label>
      {confidence && <ConfidencePill confidence={confidence} />}
    </div>
  );
}

function ConfidencePill({ confidence }: { confidence: AiImportFieldConfidence }) {
  const pct = Math.round(confidence.score * 100);
  const tone =
    confidence.level === "high"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
      : confidence.level === "medium"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      {pct}% {confidence.level}
    </span>
  );
}

function ReviewFlagChip({ flag }: { flag: AiImportReviewFlag }) {
  const tone =
    flag.severity === "warning"
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300"
      : flag.severity === "review"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300"
        : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";

  return (
    <div className={`rounded-md border px-2.5 py-1.5 text-xs ${tone}`}>
      {flag.message}
    </div>
  );
}

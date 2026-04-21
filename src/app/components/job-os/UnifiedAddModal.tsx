import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import type {
  JobOsCompany,
  JobOsRole,
  JobOsApplication,
  CompanyPriority,
  JobTrack,
} from "../../types/jobOs";

type Step = "company" | "role" | "workflow";

type WorkflowStage = "saved" | "to_apply" | "applied";

interface CompanyDraft {
  mode: "existing" | "new";
  existingId?: string;
  name: string;
  priority: CompanyPriority;
}

interface RoleDraft {
  title: string;
  url: string;
  track: JobTrack;
  fitScore: 1 | 2 | 3 | 4 | 5;
  seniority: string;
  location: string;
}

interface WorkflowDraft {
  stage: WorkflowStage;
  nextAction: string;
  dateApplied: string;
  channel: string;
}

export interface UnifiedAddModalProps {
  open: boolean;
  onClose: () => void;
  companies: JobOsCompany[];
  addCompany: (payload: Omit<JobOsCompany, "id" | "createdAt" | "updatedAt">) => Promise<string | null>;
  addRole: (payload: Omit<JobOsRole, "id" | "createdAt" | "updatedAt">) => Promise<string | null>;
  addApplication: (payload: Omit<JobOsApplication, "id" | "createdAt" | "updatedAt">) => Promise<string | null>;
}

const TRACKS: JobTrack[] = ["TPM", "Product Engineer", "Systems PM"];
const SENIORITY_OPTIONS = ["Junior", "Mid", "Senior", "Lead", "Staff", "Principal", "Director", "VP"];
const NEXT_ACTION_PRESETS = [
  "Tailor CV",
  "Submit application",
  "Research company",
  "Follow up on application",
  "Prepare for interview",
];

const TODAY = new Date().toISOString().split("T")[0];

export function UnifiedAddModal({
  open,
  onClose,
  companies,
  addCompany,
  addRole,
  addApplication,
}: UnifiedAddModalProps) {
  const [step, setStep] = useState<Step>("company");
  const [saving, setSaving] = useState(false);
  const [companySearch, setCompanySearch] = useState("");

  const [companyDraft, setCompanyDraft] = useState<CompanyDraft>({
    mode: "existing",
    existingId: undefined,
    name: "",
    priority: "B",
  });

  const [roleDraft, setRoleDraft] = useState<RoleDraft>({
    title: "",
    url: "",
    track: "TPM",
    fitScore: 3,
    seniority: "Senior",
    location: "",
  });

  const [workflowDraft, setWorkflowDraft] = useState<WorkflowDraft>({
    stage: "to_apply",
    nextAction: "",
    dateApplied: TODAY,
    channel: "",
  });

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  function reset() {
    setStep("company");
    setSaving(false);
    setCompanySearch("");
    setCompanyDraft({ mode: "existing", existingId: undefined, name: "", priority: "B" });
    setRoleDraft({ title: "", url: "", track: "TPM", fitScore: 3, seniority: "Senior", location: "" });
    setWorkflowDraft({ stage: "to_apply", nextAction: "", dateApplied: TODAY, channel: "" });
  }

  function handleClose() {
    reset();
    onClose();
  }

  function canAdvanceFromCompany() {
    if (companyDraft.mode === "existing") return !!companyDraft.existingId;
    return companyDraft.name.trim().length > 0;
  }

  function canAdvanceFromRole() {
    return roleDraft.title.trim().length > 0;
  }

  async function handleSave() {
    if (!canAdvanceFromRole()) return;
    setSaving(true);
    try {
      let companyId = companyDraft.existingId ?? null;

      if (companyDraft.mode === "new") {
        const now = new Date().toISOString();
        companyId = await addCompany({
          name: companyDraft.name.trim(),
          priority: companyDraft.priority,
          status: "Research",
          industry: "",
          size: "",
          remotePolicy: "",
          notes: "",
          sourceType: "manual",
          lastInteractionAt: now,
        });
      }

      if (!companyId) return;

      const roleStatus =
        workflowDraft.stage === "applied"
          ? "applied"
          : workflowDraft.stage === "to_apply"
          ? "to_apply"
          : "to_apply";

      const now = new Date().toISOString();
      const roleId = await addRole({
        companyId,
        title: roleDraft.title.trim(),
        url: roleDraft.url.trim(),
        track: roleDraft.track,
        fitScore: roleDraft.fitScore,
        seniority: roleDraft.seniority,
        location: roleDraft.location.trim(),
        status: roleStatus,
        nextAction: workflowDraft.nextAction.trim() || undefined,
        sourceType: "manual",
        hasApplication: workflowDraft.stage === "applied",
        lastInteractionAt: now,
      });

      if (!roleId) return;

      if (workflowDraft.stage === "applied") {
        await addApplication({
          roleId,
          companyId,
          dateApplied: workflowDraft.dateApplied || TODAY,
          channel: workflowDraft.channel.trim() || "Direct",
          cvVersion: "",
          status: "sent",
          nextAction: workflowDraft.nextAction.trim() || "",
          notes: "",
          lastResponseAt: undefined,
        });
      }

      handleClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Role to Pipeline</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          {(["company", "role", "workflow"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <span>›</span>}
              <span className={step === s ? "font-semibold text-primary" : ""}>
                {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
            </div>
          ))}
        </div>

        {/* Company step */}
        {step === "company" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setCompanyDraft((d) => ({ ...d, mode: "existing" }))}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  companyDraft.mode === "existing"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Existing company
              </button>
              <button
                onClick={() => setCompanyDraft((d) => ({ ...d, mode: "new", existingId: undefined }))}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  companyDraft.mode === "new"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                New company
              </button>
            </div>

            {companyDraft.mode === "existing" ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="max-h-48 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
                  {filteredCompanies.length === 0 ? (
                    <p className="px-3 py-4 text-center text-sm text-neutral-400">No companies found</p>
                  ) : (
                    filteredCompanies.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setCompanyDraft((d) => ({ ...d, existingId: c.id }))}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${
                          companyDraft.existingId === c.id ? "bg-primary/5 text-primary font-medium" : "text-neutral-900 dark:text-neutral-100"
                        }`}
                      >
                        <span>{c.name}</span>
                        <span className="text-xs text-neutral-400">{c.priority}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Company name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp"
                    value={companyDraft.name}
                    onChange={(e) => setCompanyDraft((d) => ({ ...d, name: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Priority</label>
                  <div className="flex gap-2">
                    {(["A", "B", "C"] as CompanyPriority[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setCompanyDraft((d) => ({ ...d, priority: p }))}
                        className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                          companyDraft.priority === p
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-neutral-400">A = top target · B = good fit · C = speculative</p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => setStep("role")}
                disabled={!canAdvanceFromCompany()}
              >
                Next: Role
              </Button>
            </div>
          </div>
        )}

        {/* Role step */}
        {step === "role" && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Role title *</label>
              <input
                type="text"
                placeholder="e.g. Senior Technical Program Manager"
                value={roleDraft.title}
                onChange={(e) => setRoleDraft((d) => ({ ...d, title: e.target.value }))}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Job listing URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={roleDraft.url}
                onChange={(e) => setRoleDraft((d) => ({ ...d, url: e.target.value }))}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Track</label>
                <select
                  value={roleDraft.track}
                  onChange={(e) => setRoleDraft((d) => ({ ...d, track: e.target.value as JobTrack }))}
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {TRACKS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Seniority</label>
                <select
                  value={roleDraft.seniority}
                  onChange={(e) => setRoleDraft((d) => ({ ...d, seniority: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {SENIORITY_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Fit score</label>
                <div className="flex gap-1">
                  {([1, 2, 3, 4, 5] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => setRoleDraft((d) => ({ ...d, fitScore: n }))}
                      className={`flex-1 rounded border py-1.5 text-xs font-medium transition-colors ${
                        roleDraft.fitScore === n
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-neutral-200 dark:border-neutral-700 text-neutral-500"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Remote, London"
                  value={roleDraft.location}
                  onChange={(e) => setRoleDraft((d) => ({ ...d, location: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("company")}>Back</Button>
              <Button onClick={() => setStep("workflow")} disabled={!canAdvanceFromRole()}>
                Next: Workflow
              </Button>
            </div>
          </div>
        )}

        {/* Workflow step */}
        {step === "workflow" && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Where is this role?</label>
              <div className="grid grid-cols-3 gap-2">
                {(["saved", "to_apply", "applied"] as WorkflowStage[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setWorkflowDraft((d) => ({ ...d, stage: s }))}
                    className={`rounded-lg border px-3 py-3 text-center transition-colors ${
                      workflowDraft.stage === s
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300"
                    }`}
                  >
                    <div className="text-xs font-medium">
                      {s === "saved" ? "Saved" : s === "to_apply" ? "To Apply" : "Applied"}
                    </div>
                    <div className="mt-0.5 text-[10px] text-neutral-400">
                      {s === "saved" ? "researching" : s === "to_apply" ? "queued" : "submitted"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {workflowDraft.stage === "applied" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Date applied</label>
                  <input
                    type="date"
                    value={workflowDraft.dateApplied}
                    onChange={(e) => setWorkflowDraft((d) => ({ ...d, dateApplied: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Channel</label>
                  <input
                    type="text"
                    placeholder="e.g. LinkedIn, Direct"
                    value={workflowDraft.channel}
                    onChange={(e) => setWorkflowDraft((d) => ({ ...d, channel: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Next action</label>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {NEXT_ACTION_PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setWorkflowDraft((d) => ({ ...d, nextAction: p }))}
                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                      workflowDraft.nextAction === p
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Or type a custom next action..."
                value={workflowDraft.nextAction}
                onChange={(e) => setWorkflowDraft((d) => ({ ...d, nextAction: e.target.value }))}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("role")}>Back</Button>
              <Button onClick={() => void handleSave()} disabled={saving}>
                {saving ? "Saving..." : "Add to pipeline"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

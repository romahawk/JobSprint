import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
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
import { Badge } from "../ui/badge";
import type {
  AfaVorschlag,
  AfaVorschlagFormData,
  AfaSource,
  AfaRfbPresent,
  AfaPortalFeedbackRequired,
  AfaMatchLevel,
  AfaActionStatus,
  AfaEmployerResponse,
  AfaRiskStatus,
  AfaDeadlineStatus,
} from "../../types/afa";

// ---------------------------------------------------------------------------
// Badge helpers (duplicated locally to keep component self-contained)
// ---------------------------------------------------------------------------

function riskClass(risk: AfaRiskStatus): string {
  switch (risk) {
    case "HIGH":   return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "MEDIUM": return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";
    case "SAFE":   return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    case "LOW":    return "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700";
    default:       return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
  }
}

function deadlineClass(status: AfaDeadlineStatus): string {
  switch (status) {
    case "OVERDUE":  return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "URGENT":   return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";
    case "UPCOMING": return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    case "SAFE":     return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    default:         return "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700";
  }
}

// ---------------------------------------------------------------------------
// Default form state
// ---------------------------------------------------------------------------

const EMPTY_FORM: AfaVorschlagFormData = {
  source: "portal",
  received_date: new Date().toISOString().slice(0, 10),
  deadline_date: null,
  rfb_present: "unknown",
  portal_feedback_required: "unknown",
  employer_name: "",
  position_title: "",
  location: "",
  posting_url: "",
  match_level: "medium",
  action_status: "received",
  applied_date: null,
  portal_feedback_date: null,
  employer_response: "pending",
  evidence: {
    folder_url: "",
    letter_file_url: "",
    application_proof_url: "",
    portal_feedback_proof_url: "",
  },
  notes: "",
};

function vorschlagToForm(v: AfaVorschlag): AfaVorschlagFormData {
  return {
    source: v.source,
    received_date: v.received_date,
    deadline_date: v.deadline_date,
    rfb_present: v.rfb_present,
    portal_feedback_required: v.portal_feedback_required,
    employer_name: v.employer_name,
    position_title: v.position_title,
    location: v.location,
    posting_url: v.posting_url,
    match_level: v.match_level,
    action_status: v.action_status,
    applied_date: v.applied_date,
    portal_feedback_date: v.portal_feedback_date,
    employer_response: v.employer_response,
    evidence: { ...v.evidence },
    notes: v.notes,
  };
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 pb-1 mb-3">
      {title}
    </h3>
  );
}

// ---------------------------------------------------------------------------
// Evidence row
// ---------------------------------------------------------------------------

function EvidenceRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2 mt-1">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="flex-1"
        />
        {value && (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-9 h-9 border border-neutral-200 dark:border-neutral-700 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-neutral-500" />
          </a>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AfaCaseModalProps {
  open: boolean;
  vorschlag: AfaVorschlag | null; // null = new case
  onClose: () => void;
  onSave: (data: AfaVorschlagFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AfaCaseModal({
  open,
  vorschlag,
  onClose,
  onSave,
  onDelete,
}: AfaCaseModalProps) {
  const isEdit = vorschlag !== null;
  const [form, setForm] = useState<AfaVorschlagFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(isEdit ? vorschlagToForm(vorschlag) : EMPTY_FORM);
    setIsSaving(false);
    setIsDeleting(false);
    setSubmitError(null);
  }, [open, vorschlag, isEdit]);

  function update<K extends keyof AfaVorschlagFormData>(
    key: K,
    value: AfaVorschlagFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateEvidence(
    key: keyof AfaVorschlagFormData["evidence"],
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      evidence: { ...prev.evidence, [key]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setIsSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save case.";
      setSubmitError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteClick(): Promise<void> {
    if (!isEdit || !onDelete) return;
    const confirmed = window.confirm(
      "Delete this case permanently? This action cannot be undone."
    );
    if (!confirmed) return;
    setSubmitError(null);
    setIsDeleting(true);
    try {
      await onDelete(vorschlag.id);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete case.";
      setSubmitError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? `Case ${vorschlag.case_id}`
              : "New Vermittlungsvorschlag"}
          </DialogTitle>
        </DialogHeader>

        {/* Computed status (edit mode only) */}
        {isEdit && (
          <div className="flex flex-wrap gap-2 -mt-1">
            <Badge variant="outline" className={riskClass(vorschlag.computed.risk_status)}>
              Risk: {vorschlag.computed.risk_status}
            </Badge>
            <Badge variant="outline" className={deadlineClass(vorschlag.computed.deadline_status)}>
              Deadline: {vorschlag.computed.deadline_status}
              {vorschlag.computed.days_left !== null &&
                ` (${vorschlag.computed.days_left}d)`}
            </Badge>
          </div>
        )}

        {submitError && (
          <div className="rounded-md border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">

          {/* Core Info */}
          <div>
            <SectionHeader title="Core Info" />
            {isEdit && (
              <div className="mb-3">
                <Label className="text-xs">Case ID</Label>
                <p className="mt-1 font-mono text-sm text-neutral-500 dark:text-neutral-400">
                  {vorschlag.case_id}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="received_date">Received Date *</Label>
                <Input
                  id="received_date"
                  type="date"
                  value={form.received_date}
                  onChange={(e) => update("received_date", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="source">Source *</Label>
                <Select
                  value={form.source}
                  onValueChange={(v) => update("source", v as AfaSource)}
                >
                  <SelectTrigger id="source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portal">Portal</SelectItem>
                    <SelectItem value="paper">Paper</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="employer_name">Employer *</Label>
                <Input
                  id="employer_name"
                  value={form.employer_name}
                  onChange={(e) => update("employer_name", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="position_title">Position *</Label>
                <Input
                  id="position_title"
                  value={form.position_title}
                  onChange={(e) => update("position_title", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="match_level">Match Level</Label>
                <Select
                  value={form.match_level}
                  onValueChange={(v) => update("match_level", v as AfaMatchLevel)}
                >
                  <SelectTrigger id="match_level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="posting_url">Job Posting URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="posting_url"
                    value={form.posting_url}
                    onChange={(e) => update("posting_url", e.target.value)}
                    placeholder="https://…"
                    className="flex-1"
                  />
                  {form.posting_url && (
                    <a
                      href={form.posting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-9 h-9 border border-neutral-200 dark:border-neutral-700 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-neutral-500" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Risk Section */}
          <div>
            <SectionHeader title="Risk & RFB" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="rfb_present">RFB Present</Label>
                <Select
                  value={form.rfb_present}
                  onValueChange={(v) =>
                    update("rfb_present", v as AfaRfbPresent)
                  }
                >
                  <SelectTrigger id="rfb_present">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="portal_feedback_required">
                  Portal Feedback Required
                </Label>
                <Select
                  value={form.portal_feedback_required}
                  onValueChange={(v) =>
                    update(
                      "portal_feedback_required",
                      v as AfaPortalFeedbackRequired
                    )
                  }
                >
                  <SelectTrigger id="portal_feedback_required">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="applied_date">Applied Date</Label>
                <Input
                  id="applied_date"
                  type="date"
                  value={form.applied_date ?? ""}
                  onChange={(e) =>
                    update("applied_date", e.target.value || null)
                  }
                />
              </div>
              <div>
                <Label htmlFor="portal_feedback_date">
                  Portal Feedback Date
                </Label>
                <Input
                  id="portal_feedback_date"
                  type="date"
                  value={form.portal_feedback_date ?? ""}
                  onChange={(e) =>
                    update("portal_feedback_date", e.target.value || null)
                  }
                />
              </div>
            </div>
          </div>

          {/* Deadline Section */}
          <div>
            <SectionHeader title="Deadline" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="deadline_date">Deadline Date</Label>
                <Input
                  id="deadline_date"
                  type="date"
                  value={form.deadline_date ?? ""}
                  onChange={(e) =>
                    update("deadline_date", e.target.value || null)
                  }
                />
              </div>
            </div>
          </div>

          {/* Action & Response */}
          <div>
            <SectionHeader title="Action & Response" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="action_status">Action Status</Label>
                <Select
                  value={form.action_status}
                  onValueChange={(v) =>
                    update("action_status", v as AfaActionStatus)
                  }
                >
                  <SelectTrigger id="action_status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="feedback_submitted">Feedback Submitted</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="justified_non_application">
                      Justified Non-Application
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="employer_response">Employer Response</Label>
                <Select
                  value={form.employer_response}
                  onValueChange={(v) =>
                    update("employer_response", v as AfaEmployerResponse)
                  }
                >
                  <SelectTrigger id="employer_response">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="no_response">No Response</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Evidence Links */}
          <div>
            <SectionHeader title="Evidence Links" />
            <div className="space-y-3">
              <EvidenceRow
                label="Document Folder URL"
                value={form.evidence.folder_url}
                onChange={(v) => updateEvidence("folder_url", v)}
              />
              <EvidenceRow
                label="Cover Letter File"
                value={form.evidence.letter_file_url}
                onChange={(v) => updateEvidence("letter_file_url", v)}
              />
              <EvidenceRow
                label="Application Proof"
                value={form.evidence.application_proof_url}
                onChange={(v) => updateEvidence("application_proof_url", v)}
              />
              <EvidenceRow
                label="Portal Feedback Proof"
                value={form.evidence.portal_feedback_proof_url}
                onChange={(v) =>
                  updateEvidence("portal_feedback_proof_url", v)
                }
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <SectionHeader title="Notes" />
            <Textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              placeholder="Internal notes, context, concerns…"
            />
          </div>

          {/* Audit Timeline (edit mode only) */}
          {isEdit && (
            <div>
              <SectionHeader title="Audit Timeline" />
              <div className="grid grid-cols-2 gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                <div>
                  <span className="font-medium">Created</span>
                  <p>{new Date(vorschlag.audit.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-medium">Last Updated</span>
                  <p>{new Date(vorschlag.audit.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <div>
              {isEdit && onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={handleDeleteClick}
                  disabled={isSaving || isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Case"}
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving || isDeleting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || isDeleting}>
                {isSaving
                  ? isEdit
                    ? "Saving..."
                    : "Creating..."
                  : isEdit
                    ? "Save Changes"
                    : "Create Case"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

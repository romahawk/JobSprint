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

  return (
    <div className="space-y-5">
      <ImportConfidenceBadge
        confidence={result.confidence}
        platform={result.sourcePlatform}
      />

      {result.duplicateMatch && (
        <DuplicateMatchAlert
          existingCompanyName={result.duplicateMatch.companyName}
          selectedAction={duplicateAction}
          onUpdateExisting={() => setDuplicateAction("update")}
          onCreateNew={() => setDuplicateAction("create_new")}
        />
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold border-b pb-1">Company</h3>
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
            <Label htmlFor="rv-industry">Industry</Label>
            <Input
              id="rv-industry"
              value={company.industry}
              onChange={(event) => setC("industry", event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rv-size">Size</Label>
            <Input
              id="rv-size"
              value={company.size}
              onChange={(event) => setC("size", event.target.value)}
              placeholder="e.g. 51-200"
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
            <h3 className="text-sm font-semibold">Role</h3>
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

              <div className="space-y-1.5">
                <Label>Track</Label>
                <Select
                  value={role.track}
                  onValueChange={(value) => setR("track", value as JobTrack)}
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

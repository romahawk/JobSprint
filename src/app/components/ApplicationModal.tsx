import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { Application, ApplicationType, Priority, PipelineStatus } from "../types";

interface ApplicationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (app: Omit<Application, "id">) => void;
  existingApp?: Application;
}

type ApplicationFormData = Omit<Application, "id">;
type FormErrors = Partial<Record<keyof ApplicationFormData, string>>;

function getInitialForm(existingApp?: Application): ApplicationFormData {
  return {
    company: existingApp?.company || "",
    role: existingApp?.role || "",
    location: existingApp?.location || "",
    type: existingApp?.type || "product",
    salary: existingApp?.salary || "",
    jobLink: existingApp?.jobLink || "",
    dateApplied:
      existingApp?.dateApplied || new Date().toISOString().split("T")[0],
    referral: existingApp?.referral || false,
    notes: existingApp?.notes || "",
    status: existingApp?.status || "targeted",
    priority: existingApp?.priority || "medium",
  };
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validateForm(formData: ApplicationFormData): FormErrors {
  const errors: FormErrors = {};
  const company = formData.company.trim();
  const role = formData.role.trim();
  const jobLink = formData.jobLink.trim();
  const dateApplied = formData.dateApplied.trim();

  if (!company) {
    errors.company = "Company is required.";
  }

  if (!role) {
    errors.role = "Role is required.";
  }

  if (!dateApplied) {
    errors.dateApplied = "Date applied is required.";
  } else {
    const parsedDate = new Date(dateApplied);
    const isInvalidDate = Number.isNaN(parsedDate.getTime());
    if (isInvalidDate) {
      errors.dateApplied = "Date applied must be a valid date.";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      parsedDate.setHours(0, 0, 0, 0);
      if (parsedDate > today) {
        errors.dateApplied = "Date applied cannot be in the future.";
      }
    }
  }

  if (jobLink && !isValidHttpUrl(jobLink)) {
    errors.jobLink = "Job link must be a valid http(s) URL.";
  }

  return errors;
}

export function ApplicationModal({
  open,
  onClose,
  onSave,
  existingApp,
}: ApplicationModalProps) {
  const [formData, setFormData] = useState<ApplicationFormData>(() =>
    getInitialForm(existingApp)
  );
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!open) return;
    // Intentional: reset form to latest existingApp data when modal opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(getInitialForm(existingApp));
    setErrors({});
  }, [existingApp, open]);

  const liveErrors = useMemo(() => validateForm(formData), [formData]);
  const isFormValid = Object.keys(liveErrors).length === 0;

  const clearError = (field: keyof ApplicationFormData) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const updateField = <K extends keyof ApplicationFormData>(
    field: K,
    value: ApplicationFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validateForm(formData);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSave({
      ...formData,
      company: formData.company.trim(),
      role: formData.role.trim(),
      location: formData.location.trim(),
      salary: formData.salary.trim(),
      jobLink: formData.jobLink.trim(),
      notes: formData.notes.trim(),
    });
    onClose();
    setFormData(getInitialForm());
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingApp ? "Edit Application" : "New Application"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => updateField("company", e.target.value)}
                aria-invalid={Boolean(errors.company)}
              />
              {errors.company && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {errors.company}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => updateField("role", e.target.value)}
                aria-invalid={Boolean(errors.role)}
              />
              {errors.role && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {errors.role}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: ApplicationType) =>
                  updateField("type", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="backup">Backup</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: Priority) =>
                  updateField("priority", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="backup">Backup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: PipelineStatus) =>
                  updateField("status", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="targeted">Targeted</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="hr_screen">HR Screen</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="final_round">Final Round</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salary">Salary Range</Label>
              <Input
                id="salary"
                value={formData.salary}
                onChange={(e) => updateField("salary", e.target.value)}
                placeholder="e.g. $120k - $150k"
              />
            </div>

            <div>
              <Label htmlFor="dateApplied">Date Applied</Label>
              <Input
                id="dateApplied"
                type="date"
                value={formData.dateApplied}
                onChange={(e) => updateField("dateApplied", e.target.value)}
                aria-invalid={Boolean(errors.dateApplied)}
              />
              {errors.dateApplied && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {errors.dateApplied}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="jobLink">Job Link</Label>
            <Input
              id="jobLink"
              type="url"
              value={formData.jobLink}
              onChange={(e) => updateField("jobLink", e.target.value)}
              placeholder="https://..."
              aria-invalid={Boolean(errors.jobLink)}
            />
            {errors.jobLink && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {errors.jobLink}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="referral"
              checked={formData.referral}
              onChange={(e) =>
                updateField("referral", e.target.checked)
              }
              className="rounded border-neutral-300 dark:border-neutral-700"
            />
            <Label htmlFor="referral" className="cursor-pointer">
              Referral?
            </Label>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid}>
              Save Application
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

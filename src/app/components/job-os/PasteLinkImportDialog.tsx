import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { PasteLinkInputStep } from "./PasteLinkInputStep";
import { PasteLinkReviewStep } from "./PasteLinkReviewStep";
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

type DialogStep = "input" | "analyzing" | "reviewing" | "saving" | "success";

interface PasteLinkImportDialogProps {
  open: boolean;
  onClose: () => void;
  existingCompanies: JobOsCompany[];
  addCompany: (
    payload: Omit<JobOsCompany, "id" | "createdAt" | "updatedAt">
  ) => Promise<string | null>;
  updateCompany: (
    id: string,
    updates: Partial<JobOsCompany>
  ) => Promise<void>;
  addRole: (
    payload: Omit<JobOsRole, "id" | "createdAt" | "updatedAt">
  ) => Promise<string | null>;
}

export function PasteLinkImportDialog({
  open,
  onClose,
  existingCompanies,
  addCompany,
  updateCompany,
  addRole,
}: PasteLinkImportDialogProps) {
  const [step, setStep] = useState<DialogStep>("input");
  const [importMode, setImportMode] = useState<ImportMode>("company_and_role");
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<NormalizedImportResult | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function resetAndClose() {
    setStep("input");
    setResult(null);
    setParseError(null);
    setSuccessMessage(null);
    onClose();
  }

  async function handleAnalyze(
    url: string,
    pastedText: string,
    mode: ImportMode
  ) {
    setImportMode(mode);
    setParseError(null);
    setStep("analyzing");
    try {
      const parsed = await parseFromInput({
        url,
        pastedText: pastedText || undefined,
      });
      const normalized = normalizeImportResult(parsed, url, existingCompanies);
      setResult(normalized);
      setStep("reviewing");
    } catch {
      setParseError(
        "Could not analyze the URL. Try pasting the job description text below."
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
      // Strip fields not in Omit<JobOsCompany, "id"|"createdAt"|"updatedAt">
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

      const parts: string[] = [
        updateExistingId
          ? `Updated "${companyDraft.name}".`
          : `Company "${companyDraft.name}" created.`,
      ];

      if (mode === "company_and_role" && roleDraft && companyId) {
        const {
          sourceType: rSourceType,
          ...coreRole
        } = roleDraft;
        const rolePayload: Omit<JobOsRole, "id" | "createdAt" | "updatedAt"> = {
          ...coreRole,
          companyId,
          sourceType: (rSourceType as JobOsRole["sourceType"]) ?? undefined,
        };
        await addRole(rolePayload);
        parts.push(`Role "${roleDraft.title}" added.`);
      }

      setSuccessMessage(parts.join(" "));
      setStep("success");
    } catch {
      setParseError("Failed to save. Please try again.");
      setStep("reviewing");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetAndClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Paste Link — Target Ingestion</DialogTitle>
        </DialogHeader>

        {(step === "input" || step === "analyzing") && (
          <PasteLinkInputStep
            isAnalyzing={step === "analyzing"}
            error={parseError}
            onAnalyze={handleAnalyze}
            onCancel={resetAndClose}
          />
        )}

        {(step === "reviewing" || step === "saving") && result && (
          <PasteLinkReviewStep
            result={result}
            defaultMode={importMode}
            isSaving={step === "saving"}
            onSave={handleSave}
            onBack={() => setStep("input")}
            onCancel={resetAndClose}
          />
        )}

        {step === "success" && (
          <div className="py-8 text-center space-y-5">
            <div className="text-green-600 dark:text-green-400 font-medium text-sm">
              {successMessage}
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => {
                  setStep("input");
                  setResult(null);
                  setSuccessMessage(null);
                  setParseError(null);
                }}
              >
                Import Another
              </Button>
              <Button variant="outline" onClick={resetAndClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

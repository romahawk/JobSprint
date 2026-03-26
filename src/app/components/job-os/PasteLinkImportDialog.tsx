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
  PasteLinkNextActionStep,
  type InitialImportStage,
} from "./PasteLinkNextActionStep";
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
import type { JobOsApplication, JobOsCompany, JobOsRole } from "../../types/jobOs";

type DialogStep =
  | "input"
  | "analyzing"
  | "reviewing"
  | "next_action"
  | "saving"
  | "success";

interface PendingImportState {
  companyDraft: NormalizedCompanyDraft;
  roleDraft: NormalizedRoleDraft | undefined;
  mode: ImportMode;
  updateExistingId?: string;
}

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
  addApplication: (
    payload: Omit<JobOsApplication, "id" | "createdAt" | "updatedAt">
  ) => Promise<string | null>;
}

export function PasteLinkImportDialog({
  open,
  onClose,
  existingCompanies,
  addCompany,
  updateCompany,
  addRole,
  addApplication,
}: PasteLinkImportDialogProps) {
  const [step, setStep] = useState<DialogStep>("input");
  const [importMode, setImportMode] = useState<ImportMode>("company_and_role");
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<NormalizedImportResult | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImportState | null>(null);
  const [initialStage, setInitialStage] = useState<InitialImportStage>("to_apply");
  const [nextAction, setNextAction] = useState("Apply");

  function resetAndClose() {
    setStep("input");
    setResult(null);
    setParseError(null);
    setSuccessMessage(null);
    setPendingImport(null);
    setInitialStage("to_apply");
    setNextAction("Apply");
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

  function handleReviewContinue(
    companyDraft: NormalizedCompanyDraft,
    roleDraft: NormalizedRoleDraft | undefined,
    mode: ImportMode,
    updateExistingId?: string
  ) {
    setPendingImport({
      companyDraft,
      roleDraft,
      mode,
      updateExistingId,
    });

    if (mode === "company_and_role" && roleDraft) {
      setInitialStage(roleDraft.status === "applied" ? "applied" : "to_apply");
      setNextAction(roleDraft.nextAction?.trim() || "Apply");
      setStep("next_action");
      return;
    }

    setInitialStage("saved");
    setNextAction("Research");
    void handleSave({
      companyDraft,
      roleDraft,
      mode,
      updateExistingId,
    }, "saved", "Research");
  }

  async function handleSave(
    pending: PendingImportState,
    stage: InitialImportStage,
    action: string
  ) {
    setStep("saving");

    try {
      const {
        englishFirst,
        sourceType: companySourceType,
        ...coreCompany
      } = pending.companyDraft;

      const companyPayload: Omit<JobOsCompany, "id" | "createdAt" | "updatedAt"> = {
        ...coreCompany,
        englishFirst: (englishFirst as JobOsCompany["englishFirst"]) ?? undefined,
        sourceType: (companySourceType as JobOsCompany["sourceType"]) ?? undefined,
      };

      let companyId: string | null;
      if (pending.updateExistingId) {
        await updateCompany(pending.updateExistingId, companyPayload);
        companyId = pending.updateExistingId;
      } else {
        companyId = await addCompany(companyPayload);
      }

      const parts: string[] = [
        pending.updateExistingId
          ? `Updated "${pending.companyDraft.name}".`
          : `Company "${pending.companyDraft.name}" created.`,
      ];

      if (pending.mode === "company_and_role" && pending.roleDraft && companyId) {
        const {
          sourceType: roleSourceType,
          ...coreRole
        } = pending.roleDraft;

        const rolePayload: Omit<JobOsRole, "id" | "createdAt" | "updatedAt"> = {
          ...coreRole,
          companyId,
          status: stage === "applied" ? "applied" : "to_apply",
          nextAction: action,
          sourceType: (roleSourceType as JobOsRole["sourceType"]) ?? undefined,
        };

        const roleId = await addRole(rolePayload);
        parts.push(`Role "${pending.roleDraft.title}" added.`);

        if (stage === "applied" && roleId) {
          await addApplication({
            companyId,
            roleId,
            dateApplied: new Date().toISOString().slice(0, 10),
            channel: "Imported link",
            cvAssetId: undefined,
            cvVersion: "",
            status: "sent",
            nextAction: action,
            notes: "",
            latestJobDescriptionId: undefined,
            latestCvTailoringRunId: undefined,
            tailoredCvHeadline: "",
            tailoredCvSummary: "",
            tailoredCvText: "",
            tailoredCvUpdatedAt: undefined,
          });
          parts.push("Application created.");
        } else {
          parts.push(`Next action set to "${action}".`);
        }
      }

      setSuccessMessage(parts.join(" "));
      setStep("success");
    } catch {
      setParseError("Failed to save. Please try again.");
      setStep(pending.mode === "company_and_role" && pending.roleDraft ? "next_action" : "reviewing");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) resetAndClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Paste Link - Target Ingestion</DialogTitle>
        </DialogHeader>

        {(step === "input" || step === "analyzing") && (
          <PasteLinkInputStep
            isAnalyzing={step === "analyzing"}
            error={parseError}
            onAnalyze={handleAnalyze}
            onCancel={resetAndClose}
          />
        )}

        {step === "reviewing" && result && (
          <PasteLinkReviewStep
            result={result}
            defaultMode={importMode}
            onContinue={handleReviewContinue}
            onBack={() => setStep("input")}
            onCancel={resetAndClose}
          />
        )}

        {(step === "next_action" || step === "saving") && pendingImport && (
          <PasteLinkNextActionStep
            roleTitle={pendingImport.roleDraft?.title}
            stage={initialStage}
            nextAction={nextAction}
            isSaving={step === "saving"}
            onStageChange={setInitialStage}
            onNextActionChange={setNextAction}
            onBack={() => setStep("reviewing")}
            onCancel={resetAndClose}
            onSave={() => void handleSave(pendingImport, initialStage, nextAction.trim())}
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
                  setPendingImport(null);
                  setInitialStage("to_apply");
                  setNextAction("Apply");
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

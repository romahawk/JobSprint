import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { AppNavbar } from "../components/AppNavbar";
import { AfaDashboard } from "../components/compliance/AfaDashboard";
import { AfaTable } from "../components/compliance/AfaTable";
import { AfaCaseModal } from "../components/compliance/AfaCaseModal";
import { AfaReportGenerator } from "../components/compliance/AfaReportGenerator";
import { useAfaCompliance } from "../hooks/useAfaCompliance";
import { useApp } from "../context";
import type { AfaVorschlag, AfaVorschlagFormData } from "../types/afa";

export default function AfaCompliancePage() {
  const { session, authLoading } = useApp();
  const {
    cases,
    loading,
    error,
    addCase,
    updateCase,
    deleteCase,
    markApplied,
    markFeedbackSubmitted,
    closeCase,
  } = useAfaCompliance(session?.userId ?? null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<AfaVorschlag | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  function handleOpenNew() {
    setSelectedCase(null);
    setModalOpen(true);
  }

  function handleOpenDetails(v: AfaVorschlag) {
    setSelectedCase(v);
    setModalOpen(true);
  }

  function handleClose() {
    setModalOpen(false);
    setSelectedCase(null);
  }

  async function handleSave(data: AfaVorschlagFormData): Promise<void> {
    if (selectedCase) {
      await updateCase(selectedCase.id, data);
      toast.success("Case updated");
      return;
    }
    await addCase(data);
    toast.success("Case created");
  }

  function requestDelete(id: string): void {
    setDeleteConfirmId(id);
  }

  async function confirmDelete(): Promise<void> {
    if (!deleteConfirmId) return;
    await deleteCase(deleteConfirmId);
    toast.success("Case deleted");
    setDeleteConfirmId(null);
    handleClose();
  }

  // Kept for AfaCaseModal's onDelete signature compatibility
  async function handleDelete(id: string): Promise<void> {
    requestDelete(id);
  }

  return (
    <div className="min-h-screen bg-background text-foreground app-bg-pattern">
      <AppNavbar
        title="AfA Compliance"
        subtitle="Vermittlungsvorschläge"
        rightActions={
          <Button className="gap-1.5" onClick={handleOpenNew}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Case</span>
          </Button>
        }
      />

      <main className="max-w-[1800px] mx-auto px-6 py-6 space-y-6">
        {error && (
          <div className="border border-red-200 dark:border-red-900/50 rounded-lg px-4 py-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm">
            Compliance sync notice: {error}
          </div>
        )}

        {authLoading || loading ? (
          <div className="flex items-center justify-center py-24 text-neutral-400 dark:text-neutral-600 text-sm">
            Loading compliance cases...
          </div>
        ) : (
          <>
            <AfaDashboard cases={cases} />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  All Cases
                </h2>
                <span className="text-xs text-muted-foreground/60">
                  {cases.length} total
                </span>
              </div>
              <AfaTable
                cases={cases}
                onOpenDetails={handleOpenDetails}
                onMarkApplied={markApplied}
                onMarkFeedback={markFeedbackSubmitted}
                onCloseCase={closeCase}
                onDeleteCase={requestDelete}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Report Generator
                </h2>
              </div>
              <AfaReportGenerator cases={cases} />
            </div>
          </>
        )}
      </main>

      <AfaCaseModal
        open={modalOpen}
        vorschlag={selectedCase}
        onClose={handleClose}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this compliance case?</AlertDialogTitle>
            <AlertDialogDescription>
              This case will be permanently removed and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={() => void confirmDelete()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

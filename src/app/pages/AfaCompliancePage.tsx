import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Plus, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "../components/ui/button";
import { AfaDashboard } from "../components/compliance/AfaDashboard";
import { AfaTable } from "../components/compliance/AfaTable";
import { AfaCaseModal } from "../components/compliance/AfaCaseModal";
import { useAfaCompliance } from "../hooks/useAfaCompliance";
import { useApp } from "../context";
import type { AfaVorschlag, AfaVorschlagFormData } from "../types/afa";

export default function AfaCompliancePage() {
  const { session, authLoading, darkMode, toggleDarkMode, signOut } = useApp();
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

  function handleSave(data: AfaVorschlagFormData) {
    if (selectedCase) {
      updateCase(selectedCase.id, data);
    } else {
      addCase(data);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-[1800px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
            <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
            <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              AfA Compliance
            </h1>
            <span className="text-xs text-neutral-400 dark:text-neutral-600 hidden md:inline">
              Vermittlungsvorschläge
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleOpenNew}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Case</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="gap-1.5 text-neutral-500"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1800px] mx-auto px-6 py-6 space-y-6">
        {error && (
          <div className="border border-red-200 dark:border-red-900/50 rounded-lg px-4 py-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm">
            Failed to load compliance data: {error}
          </div>
        )}

        {authLoading || loading ? (
          <div className="flex items-center justify-center py-24 text-neutral-400 dark:text-neutral-600 text-sm">
            Loading compliance cases…
          </div>
        ) : (
          <>
            <AfaDashboard cases={cases} />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                  All Cases
                </h2>
                <span className="text-xs text-neutral-400 dark:text-neutral-600">
                  {cases.length} total
                </span>
              </div>
              <AfaTable
                cases={cases}
                onOpenDetails={handleOpenDetails}
                onMarkApplied={markApplied}
                onMarkFeedback={markFeedbackSubmitted}
                onCloseCase={closeCase}
              />
            </div>
          </>
        )}
      </main>

      <AfaCaseModal
        open={modalOpen}
        vorschlag={selectedCase}
        onClose={handleClose}
        onSave={handleSave}
        onDelete={deleteCase}
      />
    </div>
  );
}

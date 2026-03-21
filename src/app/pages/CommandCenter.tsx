import React, { useState } from "react";
import { AppNavbar } from "../components/AppNavbar";
import { PasteJobUrlPanel } from "../components/PasteJobUrlPanel";
import { ImportedJobPreviewCard } from "../components/ImportedJobPreviewCard";
import { TodayTasksPanel } from "../components/TodayTasksPanel";
import { NextBestActionCard } from "../components/NextBestActionCard";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { useApp } from "../context";
import type { ImportResult } from "../services/jobImportOrchestrator";
import { scoreApplicationOpportunity } from "../services/nextBestActionEngine";

export default function CommandCenter() {
  const {
    applications,
    tasks,
    opportunityScores,
    userProfileSignals,
    addApplicationAndReturn,
    createTasksForApplication,
    saveOpportunityScore,
    toggleTaskStatus,
    dismissTask,
  } = useApp();

  const [pendingResult, setPendingResult] = useState<ImportResult | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const isEmpty = applications.length === 0;

  // When the user confirms the preview, save to pipeline
  const handleConfirm = () => {
    if (!pendingResult) return;
    const { applicationDraft, tasks: draftTasks, score: draftScore } = pendingResult;

    const saved = addApplicationAndReturn(applicationDraft);

    // Persist score with the real id
    const realScore = {
      ...draftScore,
      applicationId: saved.id,
    };
    saveOpportunityScore(realScore);

    // Persist tasks with the real id
    const realTasks = draftTasks.map((t) => ({ ...t, applicationId: saved.id }));
    createTasksForApplication(saved.id, realTasks);

    setPendingResult(null);
    setDialogOpen(false);
  };

  const handleDiscard = () => {
    setPendingResult(null);
    setDialogOpen(false);
  };

  const handleDialogImport = (result: ImportResult) => {
    setPendingResult(result);
  };

  // Highest-scoring application for the NBA card
  const topScore = [...opportunityScores].sort((a, b) => b.total - a.total)[0];
  const topApplication = topScore
    ? applications.find((a) => a.id === topScore.applicationId)
    : null;

  // Fallback: if no scored applications yet, score the first one on the fly
  const featuredApp = topApplication ?? applications[0] ?? null;
  const featuredScore =
    topScore && topApplication
      ? topScore
      : featuredApp
      ? scoreApplicationOpportunity(featuredApp, userProfileSignals ?? undefined)
      : null;

  const featuredTasks = featuredApp
    ? tasks.filter((t) => t.applicationId === featuredApp.id)
    : [];

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (isEmpty && !pendingResult) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Paste a job URL to begin</h1>
          <p className="text-muted-foreground text-sm max-w-sm">
            JobSprint will extract the details, score the opportunity, and generate your first actions.
          </p>
        </div>
        {pendingResult === null && (
          <PasteJobUrlPanel onImportComplete={setPendingResult} />
        )}
      </div>
    );
  }

  // ── Preview card after import (empty state transition) ───────────────────────
  if (isEmpty && pendingResult) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center mb-6 space-y-1">
          <h1 className="text-xl font-semibold text-foreground">Job imported</h1>
          <p className="text-muted-foreground text-sm">Review the details then add to your pipeline.</p>
        </div>
        <ImportedJobPreviewCard
          result={pendingResult}
          onConfirm={handleConfirm}
          onDiscard={handleDiscard}
        />
      </div>
    );
  }

  // ── Populated state ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <AppNavbar
        title="Command Centre"
        subtitle={`${applications.length} application${applications.length !== 1 ? "s" : ""}`}
        rightActions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                + Add job
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add a job</DialogTitle>
              </DialogHeader>
              {pendingResult ? (
                <ImportedJobPreviewCard
                  result={pendingResult}
                  onConfirm={handleConfirm}
                  onDiscard={handleDiscard}
                />
              ) : (
                <PasteJobUrlPanel onImportComplete={handleDialogImport} />
              )}
            </DialogContent>
          </Dialog>
        }
      />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main: Next Best Action */}
          <div className="lg:col-span-2 space-y-6">
            {featuredApp && featuredScore ? (
              <NextBestActionCard
                application={featuredApp}
                score={featuredScore}
                tasks={featuredTasks}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                No scored applications yet.
              </div>
            )}
          </div>

          {/* Sidebar: Today's tasks */}
          <div className="lg:col-span-1">
            <TodayTasksPanel
              tasks={tasks}
              onToggle={toggleTaskStatus}
              onDismiss={dismissTask}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

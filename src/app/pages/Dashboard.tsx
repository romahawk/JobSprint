import { useEffect, useState } from "react";
import { useApp } from "../context";
import { KPICard } from "../components/KPICard";
import { PipelineBoard } from "../components/PipelineBoard";
import { WeeklyExecutionPanel } from "../components/WeeklyExecutionPanel";
import { ProbabilityEnginePanel } from "../components/ProbabilityEnginePanel";
import { ActivitySignalCard } from "../components/ActivitySignalCard";
import { ApplicationModal } from "../components/ApplicationModal";
import { ApplicationDetailsModal } from "../components/ApplicationDetailsModal";
import { Button } from "../components/ui/button";
import { SyncStatusBadge } from "../components/SyncStatusBadge";
import {
  Target,
  Calendar,
  TrendingUp,
  Users,
  Award,
  Percent,
  Plus,
  BarChart3,
  Moon,
  Sun,
  Undo2,
  LogOut,
} from "lucide-react";
import { calculateMetrics } from "../utils";
import type { Application, PipelineStatus } from "../types";
import { Link } from "react-router";

export default function Dashboard() {
  const {
    applications,
    addApplication,
    updateApplication,
    scheduleDeleteApplication,
    undoDeleteApplication,
    pendingDeletions,
    darkMode,
    toggleDarkMode,
    session,
    signOut,
  } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [now, setNow] = useState(Date.now());

  const metrics = calculateMetrics(applications);
  const latestPendingDeletion = pendingDeletions[0] || null;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCardClick = (app: Application) => {
    setSelectedApp(app);
    setDetailsModalOpen(true);
  };

  const handleEdit = (app: Application) => {
    setEditingApp(app);
    setDetailsModalOpen(false);
    setModalOpen(true);
  };

  const handleSave = (appData: Omit<Application, "id">) => {
    if (editingApp) {
      updateApplication(editingApp.id, appData);
      setEditingApp(null);
    } else {
      addApplication(appData);
    }
  };

  const handleUpdateStatus = (id: string, status: PipelineStatus) => {
    updateApplication(id, { status });
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">JobSprint</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 hidden sm:block">
                Your job search is a numbers game. This makes the numbers visible.
              </p>
              {session?.email && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Signed in as {session.email}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <SyncStatusBadge />
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="gap-2"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Link to="/analytics">
                <Button variant="outline" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </Button>
              </Link>
              <Button onClick={() => setModalOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Application</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void signOut();
                }}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-6">
        {latestPendingDeletion && (
          <div className="mb-6 border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Removed <strong>{latestPendingDeletion.company}</strong>. Undo available for{" "}
              {Math.max(0, Math.ceil((latestPendingDeletion.expiresAt - now) / 1000))}s.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => undoDeleteApplication(latestPendingDeletion.id)}
            >
              <Undo2 className="w-4 h-4" />
              Undo
            </Button>
          </div>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <KPICard
            label="Total Applications"
            value={metrics.total}
            icon={<Target className="w-4 h-4" />}
          />
          <KPICard
            label="This Week"
            value={metrics.thisWeek}
            icon={<Calendar className="w-4 h-4" />}
          />
          <KPICard
            label="Response Rate"
            value={`${metrics.responseRate.toFixed(1)}%`}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <KPICard
            label="Interviews"
            value={metrics.interviewsScheduled}
            icon={<Users className="w-4 h-4" />}
          />
          <KPICard
            label="Offers"
            value={metrics.offers}
            icon={<Award className="w-4 h-4" />}
          />
          <KPICard
            label="Offer Probability"
            value={`${metrics.estimatedOfferProbability.toFixed(1)}%`}
            icon={<Percent className="w-4 h-4" />}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Pipeline Board - Takes 3 columns */}
          <div className="xl:col-span-3">
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 bg-white dark:bg-neutral-950">
              <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase tracking-wide mb-6">
                Application Pipeline
              </h2>
              <PipelineBoard
                applications={applications}
                onUpdateStatus={handleUpdateStatus}
                onCardClick={handleCardClick}
              />
            </div>
          </div>

          {/* Right Side Panels */}
          <div className="xl:col-span-1 space-y-6">
            <ActivitySignalCard />
            <WeeklyExecutionPanel />
            <ProbabilityEnginePanel />
          </div>
        </div>
      </main>

      {/* Modals */}
      <ApplicationModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingApp(null);
        }}
        onSave={handleSave}
        existingApp={editingApp || undefined}
      />

      <ApplicationDetailsModal
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedApp(null);
        }}
        application={selectedApp}
        onEdit={handleEdit}
        onDelete={scheduleDeleteApplication}
      />
    </div>
  );
}

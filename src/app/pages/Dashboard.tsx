import { useState } from "react";
import { useApp } from "../context";
import { KPICard } from "../components/KPICard";
import { PipelineBoard } from "../components/PipelineBoard";
import { WeeklyExecutionPanel } from "../components/WeeklyExecutionPanel";
import { ProbabilityEnginePanel } from "../components/ProbabilityEnginePanel";
import { ActivitySignalCard } from "../components/ActivitySignalCard";
import { ApplicationModal } from "../components/ApplicationModal";
import { ApplicationDetailsModal } from "../components/ApplicationDetailsModal";
import { Button } from "../components/ui/button";
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
} from "lucide-react";
import { calculateMetrics } from "../utils";
import type { Application, PipelineStatus } from "../types";
import { Link } from "react-router";

export default function Dashboard() {
  const { applications, addApplication, updateApplication, deleteApplication, darkMode, toggleDarkMode } =
    useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  const metrics = calculateMetrics(applications);

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
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-6">
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
        onDelete={deleteApplication}
      />
    </div>
  );
}

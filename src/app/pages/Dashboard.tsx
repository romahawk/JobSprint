import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context";
import { useJobOs } from "../hooks/useJobOs";
import { KPICard } from "../components/KPICard";
import { PipelineBoard } from "../components/PipelineBoard";
import { WeeklyExecutionPanel } from "../components/WeeklyExecutionPanel";
import { ProbabilityEnginePanel } from "../components/ProbabilityEnginePanel";
import { ActivitySignalCard } from "../components/ActivitySignalCard";
import { ApplicationModal } from "../components/ApplicationModal";
import type { RoleOption } from "../components/ApplicationModal";
import { ApplicationDetailsModal } from "../components/ApplicationDetailsModal";
import { Button } from "../components/ui/button";
import { AppNavbar } from "../components/AppNavbar";
import {
  Target,
  Calendar,
  TrendingUp,
  Users,
  Award,
  Percent,
  Plus,
  Undo2,
} from "lucide-react";
import { calculateMetrics } from "../utils";
import type { Application, PipelineStatus } from "../types";

export default function Dashboard() {
  const {
    applications,
    addApplication,
    updateApplication,
    scheduleDeleteApplication,
    undoDeleteApplication,
    pendingDeletions,
    session,
  } = useApp();
  const { roles, companies } = useJobOs(session?.uid ?? null);
  const roleOptions = useMemo<RoleOption[]>(() => {
    const companyMap = new Map(companies.map((c) => [c.id, c.name]));
    return roles.map((r) => ({
      id: r.id,
      companyName: companyMap.get(r.companyId) ?? r.companyId,
      title: r.title,
      location: r.location,
      url: r.url,
    }));
  }, [roles, companies]);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  // eslint-disable-next-line react-hooks/purity
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
      <AppNavbar
        title="JobSprint"
        subtitle={
          session?.email
            ? `Your job search is a numbers game. Signed in as ${session.email}`
            : "Your job search is a numbers game. This makes the numbers visible."
        }
        showSync
        rightActions={
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Application</span>
          </Button>
        }
      />

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
            tone="blue"
          />
          <KPICard
            label="This Week"
            value={metrics.thisWeek}
            icon={<Calendar className="w-4 h-4" />}
            tone="orange"
          />
          <KPICard
            label="Response Rate"
            value={`${metrics.responseRate.toFixed(1)}%`}
            icon={<TrendingUp className="w-4 h-4" />}
            tone="green"
          />
          <KPICard
            label="Interviews"
            value={metrics.interviewsScheduled}
            icon={<Users className="w-4 h-4" />}
            tone="blue"
          />
          <KPICard
            label="Offers"
            value={metrics.offers}
            icon={<Award className="w-4 h-4" />}
            tone="green"
          />
          <KPICard
            label="Offer Probability"
            value={`${metrics.estimatedOfferProbability.toFixed(1)}%`}
            icon={<Percent className="w-4 h-4" />}
            tone="neutral"
          />
        </div>

        {/* Pipeline Full Width */}
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 bg-white dark:bg-neutral-950 mb-6">
          <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase tracking-wide mb-6">
            Application Pipeline
          </h2>
          <PipelineBoard
            applications={applications}
            onUpdateStatus={handleUpdateStatus}
            onCardClick={handleCardClick}
          />
        </div>

        {/* Activity and Execution Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ActivitySignalCard />
          <WeeklyExecutionPanel />
          <ProbabilityEnginePanel />
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
        roleOptions={roleOptions}
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

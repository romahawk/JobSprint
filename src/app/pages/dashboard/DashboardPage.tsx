import { useMemo } from "react";
import { useApp } from "../../context";
import { useJobOs } from "../../hooks/useJobOs";
import { useJobOsSyncSnapshot } from "../../services/jobOsSync";
import {
  getNextActions,
  getHotOpportunities,
  getPipelineStats,
} from "../../services/execution/nextActionEngine";
import { AppNavbar } from "../../components/AppNavbar";
import { TodayPanel } from "../../components/dashboard/TodayPanel";
import { HotOpportunities } from "../../components/dashboard/HotOpportunities";
import { PipelineStats } from "../../components/dashboard/PipelineStats";
import { ProbabilityPanel } from "../../components/dashboard/ProbabilityPanel";
import { QuickActions } from "../../components/dashboard/QuickActions";

export function DashboardPage() {
  const { session } = useApp();
  const jobOsSync = useJobOsSyncSnapshot();
  const { companies, roles, applications, loading } = useJobOs(
    session?.userId ?? null
  );

  const lastSyncedLabel = jobOsSync.lastSyncedAt
    ? new Date(jobOsSync.lastSyncedAt).toLocaleString()
    : "not yet synced";

  const settingsContent = session ? (
    <div className="rounded-md bg-white p-4 text-sm dark:bg-neutral-950">
      <div className="text-sm font-semibold text-foreground">Job OS sync and identity</div>
      <div className="mt-3 grid gap-2 text-xs text-neutral-600 dark:text-neutral-300">
        <div>Email: {jobOsSync.email ?? session.email}</div>
        <div>Data user ID: {jobOsSync.dataUserId ?? session.userId}</div>
        <div>Storage mode: {jobOsSync.storageMode}</div>
        <div>Pending writes: {jobOsSync.pendingWrites}</div>
        <div>Last synced: {lastSyncedLabel}</div>
        <div className="border-t border-neutral-200 pt-2 dark:border-neutral-800">
          Status: {jobOsSync.syncNotice ?? (jobOsSync.pendingWrites > 0 ? "Saving changes..." : "Cloud sync healthy")}
        </div>
      </div>
    </div>
  ) : null;

  const actions = useMemo(
    () => (loading ? [] : getNextActions({ companies, roles, applications }, 7)),
    [companies, roles, applications, loading]
  );

  const hotOpportunities = useMemo(
    () => (loading ? [] : getHotOpportunities(roles, companies, applications)),
    [companies, roles, applications, loading]
  );

  const stats = useMemo(
    () =>
      loading
        ? { totalCompanies: 0, totalRoles: 0, toApply: 0, applied: 0, inReview: 0, interviewing: 0, offers: 0, conversionRate: 0, responseRate: 0, interviewRate: 0, offerRate: 0 }
        : getPipelineStats(companies, roles, applications),
    [companies, roles, applications, loading]
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black">
      <AppNavbar
        title="JobSprint"
        subtitle={
          session?.email
            ? `Command Centre · Signed in as ${session.email}`
            : "Command Centre · AI-powered job search execution"
        }
        showSync
        settingsContent={settingsContent}
      />

      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6">
        {/* 2-column grid on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — primary action column */}
          <div className="lg:col-span-2 space-y-6">
            <TodayPanel actions={actions} isLoading={loading} />
          </div>

          {/* Right — context column */}
          <div className="lg:self-start">
            <div className="space-y-6 lg:sticky lg:top-24">
              <QuickActions />
              <PipelineStats stats={stats} isLoading={loading} />
              <ProbabilityPanel stats={stats} isLoading={loading} />
              {(loading || hotOpportunities.length > 0) && (
                <HotOpportunities opportunities={hotOpportunities} isLoading={loading} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

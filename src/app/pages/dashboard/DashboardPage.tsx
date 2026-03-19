import { useMemo } from "react";
import { useApp } from "../../context";
import { useJobOs } from "../../hooks/useJobOs";
import {
  getNextActions,
  getHotOpportunities,
  getPipelineStats,
} from "../../services/execution/nextActionEngine";
import { TodayPanel } from "../../components/dashboard/TodayPanel";
import { HotOpportunities } from "../../components/dashboard/HotOpportunities";
import { PipelineStats } from "../../components/dashboard/PipelineStats";
import { QuickActions } from "../../components/dashboard/QuickActions";

export function DashboardPage() {
  const { session } = useApp();
  const { companies, roles, applications, loading } = useJobOs(
    session?.userId ?? null
  );

  const actions = useMemo(
    () =>
      loading
        ? []
        : getNextActions({ companies, roles, applications }, 7),
    [companies, roles, applications, loading]
  );

  const hotOpportunities = useMemo(
    () =>
      loading ? [] : getHotOpportunities(roles, companies, applications),
    [companies, roles, applications, loading]
  );

  const stats = useMemo(
    () =>
      loading
        ? { totalCompanies: 0, totalRoles: 0, toApply: 0, applied: 0, inReview: 0, interviewing: 0, offers: 0, conversionRate: 0 }
        : getPipelineStats(companies, roles, applications),
    [companies, roles, applications, loading]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Command Centre
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Your AI-powered job search execution hub.
        </p>
      </div>

      {/* Pipeline Snapshot */}
      <PipelineStats stats={stats} isLoading={loading} />

      {/* Today's Actions */}
      <TodayPanel actions={actions} isLoading={loading} />

      {/* Hot Opportunities */}
      {(loading || hotOpportunities.length > 0) && (
        <HotOpportunities opportunities={hotOpportunities} isLoading={loading} />
      )}

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}

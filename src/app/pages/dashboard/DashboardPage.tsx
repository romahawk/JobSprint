import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, ChevronUp, Layers3 } from "lucide-react";
import { useApp } from "../../context";
import { useJobOs } from "../../hooks/useJobOs";
import { useJobOsSyncSnapshot } from "../../services/jobOsSync";
import {
  getNextActions,
  getHotOpportunities,
  getPipelineStats,
} from "../../services/execution/nextActionEngine";
import {
  persistDashboardOnboardingStatus,
  type DashboardOnboardingStatus,
} from "../../services/dashboardOnboarding";
import { AppNavbar } from "../../components/AppNavbar";
import { FocusedNextAction } from "../../components/dashboard/FocusedNextAction";
import { TodayPanel } from "../../components/dashboard/TodayPanel";
import { HotOpportunities } from "../../components/dashboard/HotOpportunities";
import { PipelineStats } from "../../components/dashboard/PipelineStats";
import { ProbabilityPanel } from "../../components/dashboard/ProbabilityPanel";
import { QuickActions } from "../../components/dashboard/QuickActions";
import { FirstRunScreen } from "../../components/dashboard/FirstRunScreen";
import { AppPageShell } from "../../components/layout/AppPageShell";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { WeeklyExecutionPanel } from "../../components/WeeklyExecutionPanel";
import { GettingStartedChecklist } from "../../components/dashboard/GettingStartedChecklist";

export function DashboardPage() {
  const { session } = useApp();
  const navigate = useNavigate();
  const jobOsSync = useJobOsSyncSnapshot();
  const [supportOpen, setSupportOpen] = useState(false);
  const [checklistDismissed, setChecklistDismissed] = useState(false);
  const {
    companies,
    roles,
    applications,
    loading,
    addCompany,
    updateCompany,
    addRole,
    addApplication,
  } = useJobOs(session?.userId ?? null);

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
        ? {
            totalCompanies: 0,
            totalRoles: 0,
            toApply: 0,
            applied: 0,
            inReview: 0,
            interviewing: 0,
            offers: 0,
            conversionRate: 0,
            responseRate: 0,
            interviewRate: 0,
            offerRate: 0,
          }
        : getPipelineStats(companies, roles, applications),
    [companies, roles, applications, loading]
  );

  const isEmpty = !loading && companies.length === 0 && roles.length === 0;
  const showFirstRun = isEmpty;
  const holdDashboard = loading;
  const primaryAction = actions[0];

  function updateOnboardingStatus(nextStatus: DashboardOnboardingStatus) {
    if (!session?.userId) return;
    void persistDashboardOnboardingStatus(session.userId, nextStatus);
  }

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

      <main className="mx-auto max-w-[1800px] px-4 py-5 sm:px-6">
        {holdDashboard ? (
          <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center text-sm text-neutral-400 dark:text-neutral-600">
            Loading workspace...
          </div>
        ) : null}

        {showFirstRun ? (
          <FirstRunScreen
            existingCompanies={companies}
            addCompany={addCompany}
            updateCompany={updateCompany}
            addRole={addRole}
            addApplication={addApplication}
            onDismiss={() => {
              updateOnboardingStatus("dismissed");
              void navigate("/job-os/companies");
            }}
            onComplete={() => updateOnboardingStatus("completed")}
          />
        ) : null}

        <AppPageShell
          title="Command Center"
          subtitle="Act on the strongest next move first, then use the side rail for supporting context."
          className={showFirstRun || holdDashboard ? "hidden" : ""}
        >
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.7fr)_360px] xl:grid-cols-[minmax(0,1.8fr)_380px]">
            <div className="min-w-0 space-y-4">
              <FocusedNextAction
                action={primaryAction}
                isLoading={loading}
                queueSize={Math.max(actions.length - 1, 0)}
              />
              <TodayPanel actions={actions} isLoading={loading} />
            </div>

            <div className="min-w-0 lg:self-start">
              <div className="space-y-4 lg:sticky lg:top-24">
                <QuickActions />
                {!checklistDismissed && (
                  <GettingStartedChecklist
                    companies={companies}
                    roles={roles}
                    applications={applications}
                    onDismiss={() => setChecklistDismissed(true)}
                  />
                )}
                <WeeklyExecutionPanel />
                <WeeklyExecutionPanel applications={applications} />
                <PipelineStats stats={stats} isLoading={loading} />
                <ProbabilityPanel stats={stats} isLoading={loading} />
                <Collapsible open={supportOpen} onOpenChange={setSupportOpen}>
                  <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                    <CollapsibleTrigger className="w-full text-left">
                      <div className="flex items-center gap-2 px-4 py-3">
                        <Layers3 className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                        <div>
                          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                            Supporting Signals
                          </h2>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Use these when you want more context, not before.
                          </p>
                        </div>
                        <span className="ml-auto text-neutral-400">
                          {supportOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t border-neutral-200 px-4 py-4 dark:border-neutral-800">
                        {(loading || hotOpportunities.length > 0) ? (
                          <HotOpportunities opportunities={hotOpportunities} isLoading={loading} />
                        ) : (
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            No additional hot opportunities to surface right now.
                          </p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </section>
                </Collapsible>
              </div>
            </div>
          </div>
        </AppPageShell>
      </main>
    </div>
  );
}

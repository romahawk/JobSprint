import { NavLink } from "react-router";
import {
  Building2,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Megaphone,
} from "lucide-react";
import { AppNavbar } from "../AppNavbar";
import { useApp } from "../../context";
import { useJobOsSyncSnapshot } from "../../services/jobOsSync";

const NAV_ITEMS = [
  { to: "/job-os/assets", label: "Assets", icon: FolderOpen },
  { to: "/job-os/companies", label: "Companies", icon: Building2 },
  { to: "/job-os/roles", label: "Roles", icon: FileText },
  { to: "/job-os/applications", label: "Applications", icon: FileSpreadsheet },
  { to: "/job-os/outreach", label: "Outreach", icon: Megaphone },
];

export function JobOsLayout({
  title,
  subtitle,
  notice,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  notice?: string | null;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const { session } = useApp();
  const jobOsSync = useJobOsSyncSnapshot();
  const lastSyncedLabel = jobOsSync.lastSyncedAt
    ? new Date(jobOsSync.lastSyncedAt).toLocaleString()
    : "not yet synced";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black">
      <AppNavbar title={title} subtitle={subtitle} rightActions={actions} />
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="max-w-[1800px] mx-auto px-6 py-3">
          <nav className="flex flex-wrap gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `text-xs px-3 py-1.5 rounded-md border transition-colors inline-flex items-center gap-1.5 ${
                      isActive
                        ? "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-black dark:border-neutral-100"
                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
      <main className="max-w-[1800px] mx-auto px-6 py-6 space-y-4">
        {notice && (
          <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            {notice}
          </div>
        )}
        {session && (
          <details className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-3 text-sm">
            <summary className="cursor-pointer font-medium">
              Job OS sync and identity
            </summary>
            <div className="mt-3 grid gap-2 md:grid-cols-2 text-xs text-neutral-600 dark:text-neutral-300">
              <div>Email: {jobOsSync.email ?? session.email}</div>
              <div>Data user ID: {jobOsSync.dataUserId ?? session.userId}</div>
              <div>Auth UID: {jobOsSync.authUid ?? session.authUid ?? "local session"}</div>
              <div>Storage mode: {jobOsSync.storageMode}</div>
              <div>Pending writes: {jobOsSync.pendingWrites}</div>
              <div>Last synced: {lastSyncedLabel}</div>
              <div className="md:col-span-2">
                Status: {jobOsSync.syncNotice ?? (jobOsSync.pendingWrites > 0 ? "Saving changes..." : "Cloud sync healthy")}
              </div>
            </div>
          </details>
        )}
        {children}
      </main>
    </div>
  );
}

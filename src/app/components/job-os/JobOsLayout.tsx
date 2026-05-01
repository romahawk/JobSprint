import { NavLink, useLocation } from "react-router";
import { CommandCenter } from "./CommandCenter";
import {
  Building2,
  Compass,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Megaphone,
  Settings,
  ShieldCheck,
  WandSparkles,
} from "lucide-react";
import { AppNavbar } from "../AppNavbar";
import { useApp } from "../../context";
import { useJobOsSyncSnapshot } from "../../services/jobOsSync";
import { appPath } from "../../routing";

function getActiveSection(pathname: string): "action" | "pipeline" | "system" {
  if (
    pathname === appPath("/job-os") ||
    pathname.startsWith(appPath("/job-os/roles")) ||
    pathname.startsWith(appPath("/job-os/applications")) ||
    pathname.startsWith(appPath("/job-os/outreach"))
  ) return "pipeline";
  if (
    pathname.startsWith(appPath("/job-os/companies")) ||
    pathname.startsWith(appPath("/job-os/assets")) ||
    pathname.startsWith(appPath("/job-os/settings")) ||
    pathname.startsWith(appPath("/cv-optimizer")) ||
    pathname.startsWith(appPath("/compliance/afa"))
  ) return "system";
  return "action";
}

const SECTION_NAV = {
  action: [
    { to: appPath("/job-os/sources"), label: "Sources", icon: Compass },
  ],
  pipeline: [
    { to: appPath("/job-os/roles"), label: "Roles", icon: FileText },
    { to: appPath("/job-os/applications"), label: "Applications", icon: FileSpreadsheet },
    { to: appPath("/job-os/outreach"), label: "Outreach", icon: Megaphone },
  ],
  system: [
    { to: appPath("/job-os/companies"), label: "Target Companies", icon: Building2 },
    { to: appPath("/job-os/assets"), label: "Assets", icon: FolderOpen },
    { to: appPath("/cv-optimizer"), label: "CV Optimizer", icon: WandSparkles },
    { to: appPath("/compliance/afa"), label: "AfA Compliance", icon: ShieldCheck },
    { to: appPath("/job-os/settings"), label: "Settings", icon: Settings },
  ],
} as const;

const NAV_LINK_CLASS = ({ isActive }: { isActive: boolean }) =>
  `text-xs px-3 py-1.5 rounded-md border transition-colors inline-flex items-center gap-1.5 ${
    isActive
      ? "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-black dark:border-neutral-100"
      : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700 dark:hover:bg-neutral-800"
  }`;

export function JobOsLayout({
  title,
  subtitle,
  notice,
  children,
  actions,
  settingsFooter,
}: {
  title?: string;
  subtitle?: string;
  notice?: string | null;
  children: React.ReactNode;
  actions?: React.ReactNode;
  settingsFooter?: React.ReactNode;
}) {
  const { session } = useApp();
  const jobOsSync = useJobOsSyncSnapshot();
  const location = useLocation();
  const activeSection = getActiveSection(location.pathname);
  const navItems = SECTION_NAV[activeSection];

  const lastSyncedLabel = jobOsSync.lastSyncedAt
    ? new Date(jobOsSync.lastSyncedAt).toLocaleString()
    : "not yet synced";

  const settingsContent = session ? (
    <div className="rounded-md bg-white p-4 text-sm dark:bg-neutral-950">
      <div className="text-sm font-semibold text-foreground">Job OS sync and identity</div>
      <div className="mt-3 grid gap-2 text-xs text-neutral-600 dark:text-neutral-300">
        <div>Email: {jobOsSync.email ?? session.email}</div>
        <div>Data user ID: {jobOsSync.dataUserId ?? session.userId}</div>
        <div>Auth UID: {jobOsSync.authUid ?? session.authUid ?? "local session"}</div>
        <div>Storage mode: {jobOsSync.storageMode}</div>
        <div>Pending writes: {jobOsSync.pendingWrites}</div>
        <div>Last synced: {lastSyncedLabel}</div>
        <div className="border-t border-neutral-200 pt-2 dark:border-neutral-800">
          Status: {jobOsSync.syncNotice ?? (jobOsSync.pendingWrites > 0 ? "Saving changes..." : "Cloud sync healthy")}
        </div>
      </div>
      {settingsFooter}
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black">
      <AppNavbar
        rightActions={actions}
        settingsContent={settingsContent}
      />
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="max-w-[1800px] mx-auto px-6 py-3">
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={NAV_LINK_CLASS}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
      <CommandCenter />
      <main className="max-w-[1800px] mx-auto px-6 py-6 space-y-4">
        {notice && (
          <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            {notice}
          </div>
        )}
        {(title || subtitle) && (
          <div className="space-y-1">
            {title && <h1 className="text-xl font-bold text-neutral-900 dark:text-white">{title}</h1>}
            {subtitle && <p className="text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  BriefcaseBusiness,
  FolderOpen,
  Lock,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import { useApp } from "../context";
import { useJobOsSyncSnapshot } from "../services/jobOsSync";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { trackPageView } from "../services/analytics";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "./ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "./ui/sheet";

interface AppNavbarProps {
  title: string;
  subtitle?: string;
  rightActions?: React.ReactNode;
  showSync?: boolean;
  settingsContent?: React.ReactNode;
}

const NAV_ITEMS = [
  {
    to: "/",
    label: "Action",
    icon: LayoutDashboard,
    matches: (pathname: string) => pathname === "/" || pathname === "/analytics",
  },
  {
    to: "/job-os/applications",
    label: "Pipeline",
    icon: BriefcaseBusiness,
    matches: (pathname: string) =>
      pathname === "/job-os" ||
      pathname === "/job-os/applications" ||
      pathname === "/job-os/outreach",
  },
  {
    to: "/job-os/assets",
    label: "System",
    icon: FolderOpen,
    matches: (pathname: string) =>
      pathname === "/job-os/assets" ||
      pathname === "/job-os/companies" ||
      pathname === "/job-os/roles" ||
      pathname === "/job-os/settings" ||
      pathname === "/cv-optimizer" ||
      pathname === "/compliance/afa",
  },
];

export function AppNavbar({
  title,
  subtitle,
  rightActions,
  showSync = false,
  settingsContent,
}: AppNavbarProps) {
  const { darkMode, toggleDarkMode, signOut } = useApp();
  const jobOsSync = useJobOsSyncSnapshot();
  const location = useLocation();
  const logoutBlocked = jobOsSync.pendingWrites > 0;
  const hasSettingsMenu = Boolean(settingsContent);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on navigation
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return (
    <header
      className="sticky top-0 z-20"
      style={{ background: "var(--brand-navy)" }}
    >
      <div className="max-w-[1800px] mx-auto px-6">
        <div className="flex items-center justify-between gap-4 h-14">
          <div className="flex items-center gap-8">
            {/* Hamburger — mobile only */}
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-md text-white/65 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="text-base font-bold text-white tracking-tight">
              {title}
            </span>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = item.matches(location.pathname);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? "bg-[#124BE6] text-white"
                        : "text-white/65 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {showSync && (
              <div className="opacity-75">
                <SyncStatusBadge />
              </div>
            )}
            {rightActions}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Open settings"
                  className="w-8 h-8 flex items-center justify-center rounded-md text-white/65 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={hasSettingsMenu ? "w-[360px] p-0" : "w-[220px] p-1"}>
                {settingsContent}
                {settingsContent ? <div className="border-t border-neutral-200 dark:border-neutral-800" /> : null}
                <div className="bg-white p-1 dark:bg-neutral-950">
                  <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                    Private Access
                  </div>
                  <Link
                    to="/job-os/afa-report"
                    className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900"
                  >
                    <Lock className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                    <span>AfA Report</span>
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              className="w-8 h-8 flex items-center justify-center rounded-md text-white/65 hover:text-white hover:bg-white/10 transition-colors"
            >
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => void signOut()}
              disabled={logoutBlocked}
              title={logoutBlocked ? "Wait for Job OS changes to finish saving before signing out." : undefined}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white/65 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {logoutBlocked ? `Saving ${jobOsSync.pendingWrites}` : "Sign Out"}
              </span>
            </button>
          </div>
        </div>

        {subtitle && (
          <div className="pb-1.5 -mt-1 text-xs text-white/45 truncate">
            {subtitle}
          </div>
        )}
      </div>

      {/* Mobile nav drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <SheetTitle className="text-base font-bold tracking-tight">
              JobSprint
            </SheetTitle>
          </SheetHeader>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = item.matches(location.pathname);
              return (
                <SheetClose asChild key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary text-white"
                        : "text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                </SheetClose>
              );
            })}

            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 mt-2">
              <SheetClose asChild>
                <Link
                  to="/job-os/afa-report"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Lock className="w-4 h-4 shrink-0 text-neutral-500" />
                  AfA Report
                </Link>
              </SheetClose>
            </div>
          </nav>

          <div className="px-3 py-4 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
              {darkMode ? "Light mode" : "Dark mode"}
            </button>
            <button
              type="button"
              onClick={() => { setMobileOpen(false); void signOut(); }}
              disabled={logoutBlocked}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {logoutBlocked ? `Saving ${jobOsSync.pendingWrites}…` : "Sign Out"}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

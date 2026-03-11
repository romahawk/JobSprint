import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import {
  BarChart3,
  BriefcaseBusiness,
  Home,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { useApp } from "../context";
import { useJobOsSyncSnapshot } from "../services/jobOsSync";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { trackPageView } from "../services/analytics";

interface AppNavbarProps {
  title: string;
  subtitle?: string;
  rightActions?: React.ReactNode;
  showSync?: boolean;
}

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/job-os/applications", label: "Job OS", icon: BriefcaseBusiness },
  { to: "/compliance/afa", label: "AfA Compliance", icon: ShieldCheck },
];

export function AppNavbar({
  title,
  subtitle,
  rightActions,
  showSync = false,
}: AppNavbarProps) {
  const { darkMode, toggleDarkMode, signOut } = useApp();
  const jobOsSync = useJobOsSyncSnapshot();
  const location = useLocation();
  const logoutBlocked = jobOsSync.pendingWrites > 0;

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
          {/* Logo + Nav */}
          <div className="flex items-center gap-8">
            <span className="text-base font-bold text-white tracking-tight">
              {title}
            </span>

            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active =
                  location.pathname === item.to ||
                  (item.to !== "/" &&
                    location.pathname.startsWith(item.to));
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

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {showSync && (
              <div className="opacity-75">
                <SyncStatusBadge />
              </div>
            )}
            {rightActions}
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
    </header>
  );
}

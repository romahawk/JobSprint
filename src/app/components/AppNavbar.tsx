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
import { Button } from "./ui/button";
import { useApp } from "../context";
import { SyncStatusBadge } from "./SyncStatusBadge";

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
  const location = useLocation();

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
      <div className="max-w-[1800px] mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showSync && <SyncStatusBadge />}
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active =
                location.pathname === item.to ||
                (item.to !== "/" && location.pathname.startsWith(item.to));
              return (
                <Link key={item.to} to={item.to}>
                  <Button variant={active ? "default" : "outline"} className="gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
            {rightActions}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void signOut()} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

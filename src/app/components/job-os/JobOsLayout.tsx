import { Link, NavLink } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { useApp } from "../../context";

const NAV_ITEMS = [
  { to: "/job-os/dashboard", label: "Dashboard" },
  { to: "/job-os/assets", label: "Assets" },
  { to: "/job-os/companies", label: "Companies" },
  { to: "/job-os/roles", label: "Roles" },
  { to: "/job-os/applications", label: "Applications" },
  { to: "/job-os/outreach", label: "Outreach" },
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
  const { darkMode, toggleDarkMode } = useApp();
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black">
      <header className="sticky top-0 z-20 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="max-w-[1800px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <ArrowLeft className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <Button variant="outline" size="sm" onClick={toggleDarkMode}>
                {darkMode ? "Light" : "Dark"}
              </Button>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-xs px-3 py-1.5 rounded-md border transition-colors ${
                    isActive
                      ? "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-black dark:border-neutral-100"
                      : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-[1800px] mx-auto px-6 py-6 space-y-4">
        {notice && (
          <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            {notice}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

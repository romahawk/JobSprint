import { Link } from "react-router";
import { PlusCircle, FileText, Building2, ClipboardList } from "lucide-react";
import { appPath } from "../../routing";
import { PlusCircle, FileText, ClipboardList, Rocket } from "lucide-react";

interface QuickActionsProps {
  onAddRole?: () => void;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Add Company",
    description: "Track a new target",
    href: appPath("/job-os/companies"),
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    label: "Log Application",
    description: "Record a submission",
    href: appPath("/job-os/applications"),
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    label: "Tailor CV",
    description: "Optimise for a role",
    href: appPath("/cv-optimizer"),
    icon: <FileText className="h-4 w-4" />,
  },
  {
    label: "Browse Roles",
    description: "Review your pipeline",
    href: appPath("/job-os/roles"),
    icon: <PlusCircle className="h-4 w-4" />,
  },
];

export function QuickActions() {
export function QuickActions({ onAddRole }: QuickActionsProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={onAddRole}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 text-center shadow-sm hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <span className="text-neutral-500 dark:text-neutral-400">
            <Rocket className="h-4 w-4" />
          </span>
          <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
            Add Role
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            Company + role in one flow
          </span>
        </button>

        <Link
          to="/job-os/applications"
          className="flex flex-col items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 text-center shadow-sm hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <span className="text-neutral-500 dark:text-neutral-400">
            <ClipboardList className="h-4 w-4" />
          </span>
          <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
            Log Application
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            Record a submission
          </span>
        </Link>

        <Link
          to="/cv-optimizer"
          className="flex flex-col items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 text-center shadow-sm hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <span className="text-neutral-500 dark:text-neutral-400">
            <FileText className="h-4 w-4" />
          </span>
          <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
            Tailor CV
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            Optimise for a role
          </span>
        </Link>

        <Link
          to="/job-os/roles"
          className="flex flex-col items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 text-center shadow-sm hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <span className="text-neutral-500 dark:text-neutral-400">
            <PlusCircle className="h-4 w-4" />
          </span>
          <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
            Browse Roles
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            Review your pipeline
          </span>
        </Link>
      </div>
    </section>
  );
}

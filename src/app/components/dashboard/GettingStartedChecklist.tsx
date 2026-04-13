import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { Link } from "react-router";
import type { JobOsCompany, JobOsRole, JobOsApplication } from "../../types/jobOs";

interface ChecklistItem {
  id: string;
  label: string;
  detail: string;
  href: string;
  done: boolean;
}

interface GettingStartedChecklistProps {
  companies: JobOsCompany[];
  roles: JobOsRole[];
  applications: JobOsApplication[];
  onDismiss: () => void;
}

export function GettingStartedChecklist({
  companies,
  roles,
  applications,
  onDismiss,
}: GettingStartedChecklistProps) {
  const hasCompany = companies.length > 0;
  const hasRole = roles.length > 0;
  const hasApplication = applications.length > 0;
  const hasJd = roles.some((r) => r.jobDescription && r.jobDescription.trim().length > 0);
  const hasCvTailoring = applications.some(
    (a) => a.latestCvTailoringRunId || a.tailoredCvText
  );

  const items: ChecklistItem[] = [
    {
      id: "company",
      label: "Add a target company",
      detail: "Create your first company record in the pipeline.",
      href: "/job-os/companies",
      done: hasCompany,
    },
    {
      id: "role",
      label: "Add a role",
      detail: "Track a specific job opening at that company.",
      href: "/job-os/roles",
      done: hasRole,
    },
    {
      id: "jd",
      label: "Paste the job description",
      detail: "Used to tailor your CV and score fit.",
      href: "/cv-optimizer",
      done: hasJd,
    },
    {
      id: "cv",
      label: "Tailor your CV",
      detail: "Run the AI fit analysis and generate a targeted CV.",
      href: "/cv-optimizer",
      done: hasCvTailoring,
    },
    {
      id: "application",
      label: "Log your application",
      detail: "Record when and how you submitted.",
      href: "/job-os/applications",
      done: hasApplication,
    },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const allDone = completedCount === items.length;

  if (allDone) return null;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Getting Started
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {completedCount} of {items.length} steps complete
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          aria-label="Dismiss getting started checklist"
        >
          Dismiss
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-neutral-100 dark:bg-neutral-800">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${(completedCount / items.length) * 100}%` }}
        />
      </div>

      <ul className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 px-4 py-3">
            {item.done ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-neutral-300 dark:text-neutral-600" />
            )}
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium ${
                  item.done
                    ? "line-through text-neutral-400 dark:text-neutral-600"
                    : "text-neutral-900 dark:text-neutral-100"
                }`}
              >
                {item.label}
              </p>
              {!item.done && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {item.detail}
                </p>
              )}
            </div>
            {!item.done && (
              <Link
                to={item.href}
                className="shrink-0 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Go
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

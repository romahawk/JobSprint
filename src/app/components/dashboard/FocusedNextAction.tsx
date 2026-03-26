import { ArrowRight, Sparkles, Target } from "lucide-react";
import { Link } from "react-router";
import type { ActionPriority, NextAction } from "../../services/execution/nextActionEngine";

const PRIORITY_STYLES: Record<ActionPriority, string> = {
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  low: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
};

const TYPE_ACCENTS: Record<NextAction["type"], string> = {
  apply: "from-blue-600/15 to-cyan-500/10 text-blue-700 dark:text-blue-300",
  log_application: "from-cyan-600/15 to-sky-500/10 text-cyan-700 dark:text-cyan-300",
  follow_up: "from-violet-600/15 to-purple-500/10 text-violet-700 dark:text-violet-300",
  optimize_cv: "from-emerald-600/15 to-green-500/10 text-emerald-700 dark:text-emerald-300",
  add_role: "from-teal-600/15 to-emerald-500/10 text-teal-700 dark:text-teal-300",
  research: "from-indigo-600/15 to-blue-500/10 text-indigo-700 dark:text-indigo-300",
  archive: "from-neutral-500/10 to-neutral-400/10 text-neutral-700 dark:text-neutral-300",
};

interface FocusedNextActionProps {
  action?: NextAction;
  isLoading?: boolean;
  queueSize: number;
}

export function FocusedNextAction({
  action,
  isLoading,
  queueSize,
}: FocusedNextActionProps) {
  if (isLoading) {
    return (
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="space-y-4 animate-pulse">
          <div className="h-4 w-36 rounded bg-neutral-100 dark:bg-neutral-800" />
          <div className="h-10 w-2/3 rounded bg-neutral-100 dark:bg-neutral-800" />
          <div className="h-16 rounded bg-neutral-100 dark:bg-neutral-800" />
          <div className="flex gap-3">
            <div className="h-10 w-36 rounded bg-neutral-100 dark:bg-neutral-800" />
            <div className="h-10 w-24 rounded bg-neutral-100 dark:bg-neutral-800" />
          </div>
        </div>
      </section>
    );
  }

  if (!action) {
    return (
      <section className="overflow-hidden rounded-2xl border border-dashed border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          Focused Next Action
        </div>
        <div className="mt-4 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Your queue is clear.
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            No urgent actions are competing for attention right now. Use the side rail to add new pipeline data or review the system.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className={`border-b border-neutral-200/80 bg-gradient-to-r px-6 py-4 dark:border-neutral-800 ${TYPE_ACCENTS[action.type]}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-700 shadow-sm dark:bg-black/20 dark:text-neutral-200">
            <Sparkles className="h-3.5 w-3.5" />
            Focused Next Action
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PRIORITY_STYLES[action.priority]}`}>
            {action.priority}
          </span>
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:bg-black/20 dark:text-neutral-200">
            Score {action.score}
          </span>
          {queueSize > 0 ? (
            <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-black/20 dark:text-neutral-300">
              +{queueSize} more in queue
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 px-6 py-6 lg:grid-cols-[minmax(0,1.5fr)_220px] lg:items-end">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500 dark:text-neutral-400">
            <Target className="h-3.5 w-3.5" />
            Act now
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-[2rem]">
            {action.companyName ?? "Primary action"}
            {action.roleTitle ? `: ${action.roleTitle}` : ""}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            {action.reason}
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:items-end">
          <Link
            to={action.href}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            {action.actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="max-w-[220px] text-sm text-neutral-500 dark:text-neutral-400 lg:text-right">
            This is the highest-ranked move from your current pipeline signals.
          </p>
        </div>
      </div>
    </section>
  );
}

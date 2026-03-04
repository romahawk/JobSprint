import { ShieldAlert, Clock, AlertTriangle, CheckCircle2, FileSearch } from "lucide-react";
import { isThisWeek } from "date-fns";
import type { AfaVorschlag } from "../../types/afa";

interface AfaDashboardProps {
  cases: AfaVorschlag[];
}

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "red" | "orange" | "green" | "blue" | "neutral";
}

const COLOR_MAP: Record<MetricCardProps["color"], string> = {
  red: "border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30",
  orange: "border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/30",
  green: "border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30",
  blue: "border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30",
  neutral: "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900",
};

const VALUE_COLOR_MAP: Record<MetricCardProps["color"], string> = {
  red: "text-red-700 dark:text-red-400",
  orange: "text-orange-700 dark:text-orange-400",
  green: "text-green-700 dark:text-green-400",
  blue: "text-blue-700 dark:text-blue-400",
  neutral: "text-neutral-900 dark:text-neutral-100",
};

function MetricCard({ label, value, icon, color }: MetricCardProps) {
  return (
    <div className={`border rounded-lg p-4 ${COLOR_MAP[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide font-medium">
          {label}
        </span>
        <span className="opacity-60">{icon}</span>
      </div>
      <div className={`text-3xl font-semibold ${VALUE_COLOR_MAP[color]}`}>
        {value}
      </div>
    </div>
  );
}

export function AfaDashboard({ cases }: AfaDashboardProps) {
  const active = cases.filter((c) => c.action_status !== "closed");

  const highRisk = active.filter(
    (c) => c.computed.risk_status === "HIGH"
  ).length;

  const urgentDeadlines = active.filter(
    (c) =>
      c.computed.deadline_status === "URGENT" ||
      c.computed.deadline_status === "OVERDUE"
  ).length;

  const overdue = active.filter(
    (c) => c.computed.deadline_status === "OVERDUE"
  ).length;

  const appliedThisWeek = cases.filter(
    (c) =>
      c.applied_date !== null &&
      isThisWeek(new Date(c.applied_date), { weekStartsOn: 1 })
  ).length;

  const activeRfb = active.filter((c) => c.rfb_present === "yes").length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <MetricCard
        label="HIGH Risk Open"
        value={highRisk}
        icon={<ShieldAlert className="w-4 h-4 text-red-500" />}
        color="red"
      />
      <MetricCard
        label="Deadlines ≤ 2 Days"
        value={urgentDeadlines}
        icon={<Clock className="w-4 h-4 text-orange-500" />}
        color="orange"
      />
      <MetricCard
        label="Overdue"
        value={overdue}
        icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
        color={overdue > 0 ? "red" : "neutral"}
      />
      <MetricCard
        label="Applied This Week"
        value={appliedThisWeek}
        icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
        color="green"
      />
      <MetricCard
        label="Active RFB Cases"
        value={activeRfb}
        icon={<FileSearch className="w-4 h-4 text-blue-500" />}
        color="blue"
      />
    </div>
  );
}

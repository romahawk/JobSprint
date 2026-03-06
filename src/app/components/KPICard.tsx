import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down";
  trendValue?: string;
  tone?: "red" | "orange" | "green" | "blue" | "neutral";
}

const CARD_TONES = {
  red: "border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30",
  orange: "border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/30",
  green: "border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30",
  blue: "border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30",
  neutral: "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900",
};

export function KPICard({
  label,
  value,
  icon,
  trend,
  trendValue,
  tone = "neutral",
}: KPICardProps) {
  return (
    <div className={`border rounded-lg p-4 ${CARD_TONES[tone]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
          {label}
        </span>
        {icon && <span className="text-neutral-400 dark:text-neutral-600">{icon}</span>}
      </div>
      <div className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
        {value}
      </div>
      {trend && trendValue && (
        <div className="flex items-center gap-1 mt-2">
          {trend === "up" ? (
            <TrendingUp className="w-3 h-3 text-green-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-500" />
          )}
          <span className={`text-xs ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
}

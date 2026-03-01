import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down";
  trendValue?: string;
}

export function KPICard({ label, value, icon, trend, trendValue }: KPICardProps) {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 bg-white dark:bg-neutral-900">
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

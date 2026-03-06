import { TrendingDown, TrendingUp } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down";
  trendValue?: string;
  tone?: "red" | "orange" | "green" | "blue" | "neutral";
}

const ICON_TONE: Record<
  NonNullable<KPICardProps["tone"]>,
  { bg: string; color: string }
> = {
  blue:    { bg: "rgba(18,75,230,0.10)",  color: "#124BE6" },
  orange:  { bg: "rgba(230,170,18,0.12)", color: "#E6AA12" },
  green:   { bg: "rgba(16,185,129,0.10)", color: "#059669" },
  red:     { bg: "rgba(212,24,61,0.10)",  color: "#d4183d" },
  neutral: { bg: "rgba(59,71,102,0.10)",  color: "#3B4766" },
};

export function KPICard({
  label,
  value,
  icon,
  trend,
  trendValue,
  tone = "neutral",
}: KPICardProps) {
  const { bg, color } = ICON_TONE[tone];

  return (
    <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {icon && (
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: bg, color }}
          >
            {icon}
          </span>
        )}
      </div>

      <div className="text-[2rem] font-bold text-foreground leading-none tracking-tight">
        {value}
      </div>

      {trend && trendValue && (
        <div className="flex items-center gap-1">
          {trend === "up" ? (
            <TrendingUp className="w-3 h-3 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-500" />
          )}
          <span
            className={`text-xs font-medium ${
              trend === "up" ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
}

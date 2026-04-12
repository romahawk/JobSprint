import { useMemo } from "react";
import { BarChart2 } from "lucide-react";
import { useApp } from "../context";
import { useJobOs } from "../hooks/useJobOs";
import { AppNavbar } from "../components/AppNavbar";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { getWeeklyStats, getResponseRateTrend } from "../utils";

// ─── Benchmarks ───────────────────────────────────────────────────────────────

const BENCHMARKS = {
  responseRate: 15,    // % applied → any response
  interviewRate: 25,   // % responded → interview
  offerRate: 20,       // % interviewed → offer
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rateColor(actual: number, target: number): string {
  if (actual >= target) return "#10b981";         // green
  if (actual >= target - 5) return "#f59e0b";     // yellow
  return "#ef4444";                               // red
}

function rateLabel(actual: number, target: number): string {
  if (actual >= target) return "on target";
  if (actual >= target - 5) return "close";
  return "below target";
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function FunnelSkeleton() {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-3.5 w-52 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-3 w-40 rounded bg-neutral-100 dark:bg-neutral-800/60" />
      </div>
      <div className="space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <div className="h-3 w-36 rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-3 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
            </div>
            <div className="h-3 w-full rounded-full bg-neutral-100 dark:bg-neutral-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartSkeleton({ title }: { title: string }) {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 bg-white dark:bg-neutral-950 animate-pulse">
      <div className="h-3.5 w-40 rounded bg-neutral-200 dark:bg-neutral-800 mb-6" />
      <div className="sr-only">{title}</div>
      <div className="flex items-end gap-2 h-[260px]">
        {[55, 80, 40, 90, 65, 75, 50, 85, 60, 70].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-neutral-100 dark:bg-neutral-800"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyAnalytics() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
      <BarChart2 className="w-10 h-10 text-neutral-300 dark:text-neutral-700" />
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
        No data yet
      </p>
      <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-xs">
        Add applications to your Job OS pipeline to start seeing conversion
        analytics and funnel benchmarks.
      </p>
      <a
        href="/job-os/applications"
        className="text-xs text-blue-500 hover:underline mt-1"
      >
        Go to Applications →
      </a>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Analytics() {
  const { session, applications: legacyApps, darkMode, authLoading } = useApp();
  const { applications, loading } = useJobOs(session?.userId ?? null);

  const isDark = darkMode;
  const textColor = isDark ? "#a3a3a3" : "#525252";
  const gridColor = isDark ? "#262626" : "#e5e5e5";
  const barColor = isDark ? "#3b82f6" : "#2563eb";

  // Legacy charts still use the legacy Application model from context
  const weeklyStats = getWeeklyStats(legacyApps);
  const responseRateTrend = getResponseRateTrend(legacyApps);

  // Job OS funnel from the rich application model
  const funnel = useMemo(() => {
    const total = applications.length;
    const responded = applications.filter((a) =>
      ["screen", "case", "interview", "final", "offer", "rejected"].includes(a.status)
    ).length;
    const interviewed = applications.filter((a) =>
      ["interview", "final", "offer"].includes(a.status)
    ).length;
    const offered = applications.filter((a) => a.status === "offer").length;

    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;
    const interviewRate = responded > 0 ? Math.round((interviewed / responded) * 100) : 0;
    const offerRate = interviewed > 0 ? Math.round((offered / interviewed) * 100) : 0;

    return { total, responded, interviewed, offered, responseRate, interviewRate, offerRate };
  }, [applications]);

  // Diagnosis: cross-reference tailoring coverage
  const tailoringCoverage = useMemo(() => {
    const active = applications.filter(
      (a) => !["rejected", "ghosted"].includes(a.status)
    );
    const tailored = active.filter((a) => a.latestCvTailoringRunId != null);
    return { active: active.length, tailored: tailored.length };
  }, [applications]);

  function getDiagnosis(
    metric: "responseRate" | "interviewRate" | "offerRate",
    actual: number,
    target: number
  ): string | null {
    if (actual >= target) return null;

    if (metric === "responseRate") {
      const untailored = tailoringCoverage.active - tailoringCoverage.tailored;
      if (untailored > 0) {
        return `${untailored} of ${tailoringCoverage.active} active application${tailoringCoverage.active !== 1 ? "s" : ""} have no CV tailoring — this is the most common cause of low response rates.`;
      }
      return "Consider personalising your outreach messages for stalled applications.";
    }
    if (metric === "interviewRate") {
      return "Review your preparation notes for upcoming screens — interview conversion is below target.";
    }
    if (metric === "offerRate") {
      return "Offer conversion is below target — review your final-round prep and salary negotiation approach.";
    }
    return null;
  }

  const funnelRows = [
    {
      label: "Applied → Response",
      actual: funnel.responseRate,
      target: BENCHMARKS.responseRate,
      count: `${funnel.responded} / ${funnel.total}`,
      metric: "responseRate" as const,
    },
    {
      label: "Response → Interview",
      actual: funnel.interviewRate,
      target: BENCHMARKS.interviewRate,
      count: `${funnel.interviewed} / ${funnel.responded}`,
      metric: "interviewRate" as const,
    },
    {
      label: "Interview → Offer",
      actual: funnel.offerRate,
      target: BENCHMARKS.offerRate,
      count: `${funnel.offered} / ${funnel.interviewed}`,
      metric: "offerRate" as const,
    },
  ];

  const isLoading = loading || authLoading;
  const isEmpty =
    !isLoading && applications.length === 0 && legacyApps.length === 0;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100">
      <AppNavbar title="Analytics" subtitle="Track your performance trends" showSync />

      <main className="max-w-[1800px] mx-auto px-6 py-6 space-y-6">
        {isLoading ? (
          <>
            <FunnelSkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSkeleton title="Applications Per Week" />
              <ChartSkeleton title="Response Rate Trend" />
            </div>
          </>
        ) : isEmpty ? (
          <EmptyAnalytics />
        ) : (
        <>

        {/* Conversion Funnel with Benchmarks */}
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-900 dark:text-neutral-100">
              Pipeline Conversion vs Benchmark
            </h3>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              Benchmarks: Response 15% · Interview 25% · Offer 20%
            </span>
          </div>

          <div className="space-y-5">
            {funnelRows.map((row) => {
              const color = rateColor(row.actual, row.target);
              const label = rateLabel(row.actual, row.target);
              const diagnosis = getDiagnosis(row.metric, row.actual, row.target);
              const pct = Math.min(row.actual, 100);
              const targetPct = Math.min(row.target, 100);

              return (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {row.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400 dark:text-neutral-500">{row.count}</span>
                      <span
                        className="font-semibold tabular-nums"
                        style={{ color }}
                      >
                        {row.actual}%
                      </span>
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: color + "20",
                          color,
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  </div>

                  {/* Bar with benchmark marker */}
                  <div className="relative h-3 rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                    {/* Benchmark marker */}
                    <div
                      className="absolute top-0 h-full w-0.5 bg-neutral-400 dark:bg-neutral-500"
                      style={{ left: `${targetPct}%` }}
                      title={`Target: ${row.target}%`}
                    />
                  </div>

                  {diagnosis && (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {diagnosis}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applications Per Week */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 bg-white dark:bg-neutral-950">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase tracking-wide mb-6">
              Applications Per Week
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="week" tick={{ fill: textColor, fontSize: 12 }} />
                <YAxis tick={{ fill: textColor, fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#171717" : "#ffffff",
                    border: `1px solid ${gridColor}`,
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill={barColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Response Rate Trend */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 bg-white dark:bg-neutral-950">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase tracking-wide mb-6">
              Response Rate Trend
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={responseRateTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="week" tick={{ fill: textColor, fontSize: 12 }} />
                <YAxis tick={{ fill: textColor, fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#171717" : "#ffffff",
                    border: `1px solid ${gridColor}`,
                    borderRadius: "8px",
                  }}
                />
                <ReferenceLine
                  y={BENCHMARKS.responseRate}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{ value: `Target ${BENCHMARKS.responseRate}%`, fill: "#f59e0b", fontSize: 10, position: "insideTopRight" }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        </>
        )}
      </main>
    </div>
  );
}

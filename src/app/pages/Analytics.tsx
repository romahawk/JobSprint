import { useApp } from "../context";
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
  Cell,
} from "recharts";
import {
  getWeeklyStats,
  getResponseRateTrend,
  getConversionFunnel,
} from "../utils";

export default function Analytics() {
  const { applications, darkMode } = useApp();

  const weeklyStats = getWeeklyStats(applications);
  const responseRateTrend = getResponseRateTrend(applications);
  const conversionFunnel = getConversionFunnel(applications);

  const isDark = darkMode;
  const textColor = isDark ? "#a3a3a3" : "#525252";
  const gridColor = isDark ? "#262626" : "#e5e5e5";
  const barColor = isDark ? "#3b82f6" : "#2563eb";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100">
      {/* Header */}
      <AppNavbar title="Analytics" subtitle="Track your performance trends" showSync />

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applications Per Week */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 bg-white dark:bg-neutral-950">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase tracking-wide mb-6">
              Applications Per Week
            </h3>
            <ResponsiveContainer width="100%" height={300}>
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
            <ResponsiveContainer width="100%" height={300}>
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

          {/* Conversion Funnel */}
          <div className="lg:col-span-2 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 bg-white dark:bg-neutral-950">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase tracking-wide mb-6">
              Pipeline Conversion Funnel
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={conversionFunnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis type="number" tick={{ fill: textColor, fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="stage"
                  tick={{ fill: textColor, fontSize: 12 }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#171717" : "#ffffff",
                    border: `1px solid ${gridColor}`,
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {conversionFunnel.map((entry, index) => {
                    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}

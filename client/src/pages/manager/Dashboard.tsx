import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import api from "../../api/axios";
import { API_ROUTES } from "@/utils/constant";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PieSlice { label: string; value: number; color: string; }
interface TaskBreakdown { task: string; count: number; }
interface DashboardData {
  total: number; free: number; busy: number;
  onLeave: number; pendingApproval: number;
  pieChart: PieSlice[]; taskBreakdown: TaskBreakdown[];
}
interface StatCardProps { label: string; value: number; bg: string; }

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

interface TooltipEntry {
  value: number;
  name: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

const StatCard = ({ label, value, bg }: StatCardProps) => (
  <div className={`${bg} rounded-xl p-5 shadow`}>
    <p className="text-3xl font-bold text-white">{value}</p>
    <p className="text-sm text-white opacity-80 mt-1">{label}</p>
  </div>
);

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const name = payload[0].name;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow px-4 py-2">
        <p className="text-sm font-semibold text-gray-800">{name}</p>
        <p className="text-sm text-gray-600">{value} soldier{value !== 1 ? "s" : ""}</p>
      </div>
    );
  }
  return null;
};
// ─── Main Component ───────────────────────────────────────────────────────────

const ManagerDashboard = () => {
  const { user } = useSelector((s: RootState) => s.auth);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await api.get<{ success: boolean; data: DashboardData }>(
        `${API_ROUTES.MANAGER}/dashboard`  // ✅ was hardcoded "/manager/dashboard"
      );
      setData(res.data.data);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      console.error("Dashboard fetch failed:", err instanceof Error ? err.message : err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const pieData = data?.pieChart.filter((d) => d.value > 0) ?? [];
  const hasAnyData = data !== null && data.total > 0;

  const stats: StatCardProps[] = [
    { label: "Total Soldiers", value: data?.total ?? 0, bg: "bg-gray-800" },
    { label: "Free", value: data?.free ?? 0, bg: "bg-green-600" },
    { label: "On Duty", value: data?.busy ?? 0, bg: "bg-blue-600" },
    { label: "On Leave", value: data?.onLeave ?? 0, bg: "bg-yellow-500" },
    { label: "Pending Approval", value: data?.pendingApproval ?? 0, bg: "bg-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Here's your unit's current deployment status</p>
        </div>
        <button onClick={fetchDashboard}
          className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-all"
        >🔄 Refresh</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Deployment Overview</h2>
          <p className="text-xs text-gray-400 mb-4">Real-time free vs busy breakdown</p>
          {!hasAnyData ? (
            <div className="flex flex-col items-center justify-center h-52 text-gray-400">
              <div className="text-4xl mb-2">🪖</div>
              <p className="text-sm">No soldiers registered yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                    paddingAngle={3} dataKey="value" nameKey="label"
                  >
                    {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(value: string) => (
                    <span className="text-sm text-gray-600">{value}</span>
                  )} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                {pieData.map((d) => (
                  <div key={d.label} className="text-center">
                    <p className="text-xl font-bold" style={{ color: d.color }}>{d.value}</p>
                    <p className="text-xs text-gray-400">{d.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Active Task Breakdown</h2>
          <p className="text-xs text-gray-400 mb-4">Which tasks soldiers are doing right now</p>
          {!data?.taskBreakdown?.length ? (
            <div className="flex flex-col items-center justify-center h-52 text-gray-400">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-sm">No active assignments right now</p>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              {data.taskBreakdown.map((t) => (
                <div key={t.task} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium text-gray-700">{t.task}</span>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {t.count} soldier{t.count > 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {lastUpdated && (
        <p className="text-xs text-gray-400 text-right">
          Last updated: {lastUpdated.toLocaleTimeString("en-IN")} · Auto-refreshes every 60s
        </p>
      )}
    </div>
  );
};

export default ManagerDashboard;
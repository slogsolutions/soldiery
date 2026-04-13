import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "../../api/axios";
import { API_ROUTES } from "@/utils/constant";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PieSlice {
  label: string;
  value: number;
  color: string;
}
interface TaskBreakdown {
  task: string;
  count: number;
}
interface DashboardData {
  total: number;
  free: number;
  busy: number;
  onLeave: number;
  pendingApproval: number;
  pieChart: PieSlice[];
  taskBreakdown: TaskBreakdown[];
}
interface StatCardProps {
  label: string;
  value: number;
  bg: string;
  icon: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; name: string }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const extractError = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
};

// ─── Stat Card (dynamic hover: lift + icon scale) ─────────────────────────────

const StatCard = ({ label, value, bg, icon }: StatCardProps) => (
  <div
    className={`${bg} rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/20 backdrop-blur-[2px] cursor-default`}
  >
    <div className="flex items-center justify-between">
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      <span className="text-2xl opacity-80 transition-transform duration-200 group-hover:scale-110">{icon}</span>
    </div>
    <p className="text-sm text-white/90 font-medium mt-2">{label}</p>
  </div>
);

// ─── Custom Tooltip (same as before) ───────────────────────────────────────────
const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const name = payload[0].name;
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-100 rounded-xl shadow-lg px-4 py-2 transition-all duration-200 scale-100">
        <p className="text-sm font-semibold text-gray-800">{name}</p>
        <p className="text-sm text-gray-600">
          {value} soldier{value !== 1 ? "s" : ""}
        </p>
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
        `${API_ROUTES.MANAGER}/dashboard`,
      );
      setData(res.data.data);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      console.error("Dashboard fetch failed:", extractError(err));
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
          <div className="text-5xl mb-3 animate-pulse">📊</div>
          <p className="text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const pieData = data?.pieChart.filter((d) => d.value > 0) ?? [];
  const hasAnyData = data !== null && data.total > 0;

  const stats: StatCardProps[] = [
    { label: "Total Soldiers", value: data?.total ?? 0, bg: "bg-gradient-to-br from-slate-700 to-slate-800", icon: "🪖" },
    { label: "Free", value: data?.free ?? 0, bg: "bg-gradient-to-br from-emerald-500 to-teal-600", icon: "✅" },
    { label: "On Duty", value: data?.busy ?? 0, bg: "bg-gradient-to-br from-blue-500 to-indigo-600", icon: "⚙️" },
    { label: "On Leave", value: data?.onLeave ?? 0, bg: "bg-gradient-to-br from-amber-400 to-orange-500", icon: "🏖️" },
    { label: "Pending Approval", value: data?.pendingApproval ?? 0, bg: "bg-gradient-to-br from-rose-500 to-red-600", icon: "⏳" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-7">
        {/* header with button hover effects */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Welcome, {user?.name} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              Real‑time unit deployment overview
            </p>
          </div>
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            🔄 Refresh
          </button>
        </div>

        {/* stat cards - each lifts on hover */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
          {/* pie chart card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              Deployment Overview
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              Real-time free vs busy breakdown
            </p>
            {!hasAnyData ? (
              <div className="flex flex-col items-center justify-center h-52 text-gray-400">
                <div className="text-5xl mb-3">🪖</div>
                <p className="text-sm font-medium">No soldiers registered yet</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="label"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      formatter={(value: string) => (
                        <span className="text-sm text-gray-600 font-medium">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-3">
                  {pieData.map((d) => (
                    <div key={d.label} className="text-center transition-transform duration-200 hover:scale-110">
                      <p className="text-2xl font-bold" style={{ color: d.color }}>
                        {d.value}
                      </p>
                      <p className="text-xs text-gray-400 font-medium">{d.label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* task breakdown card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              Active Task Breakdown
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              Which tasks soldiers are doing right now
            </p>
            {!data?.taskBreakdown?.length ? (
              <div className="flex flex-col items-center justify-center h-52 text-gray-400">
                <div className="text-5xl mb-3">📋</div>
                <p className="text-sm font-medium">No active assignments right now</p>
              </div>
            ) : (
              <div className="space-y-3 mt-2">
                {data.taskBreakdown.map((t) => (
                  <div
                    key={t.task}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 transition-all duration-200 hover:bg-gray-100 hover:shadow-md hover:-translate-y-0.5 cursor-default"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-400 shadow-sm transition-all duration-200 group-hover:scale-125" />
                      <span className="text-sm font-semibold text-gray-700">
                        {t.task}
                      </span>
                    </div>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-inner transition-all duration-200 hover:bg-blue-200">
                      {t.count} soldier{t.count > 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {lastUpdated && (
          <p className="text-xs text-gray-400 text-right font-mono">
            Last updated: {lastUpdated.toLocaleTimeString("en-IN")} · Auto‑refreshes every 60s
          </p>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
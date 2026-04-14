import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import {
  setAssignments,
  setAssignmentLoading,
  setAssignmentError,
} from "../../store/slices/assignmentSlice";
import api from "../../api/axios";
import { API_ROUTES } from "@/utils/constant";
import Badge from "../../components/ui/Badge";
import type { Assignment } from "../../store/slices/assignmentSlice";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const extractError = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
};

// ─── Stat Card (dynamic hover: lift + icon scale) ────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  gradient: string;
  icon: string;
}

const StatCard = ({ label, value, gradient, icon }: StatCardProps) => (
  <div
    className={`${gradient} rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/20 backdrop-blur-[2px] cursor-default`}
  >
    <div className="flex items-center justify-between">
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      <span className="text-2xl opacity-80 transition-transform duration-200 group-hover:scale-110">{icon}</span>
    </div>
    <p className="text-sm text-white/90 font-medium mt-2">{label}</p>
  </div>
);

// ─── Active Task Card (hover glow + subtle scale) ─────────────────────────────

const ActiveTaskCard = ({ assignment }: { assignment: Assignment }) => (
  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-white">
    <p className="text-sm opacity-80 mb-1 flex items-center gap-1">
      <span className="text-base">⚡</span> Currently on duty
    </p>
    <h2 className="text-2xl font-bold mb-2 tracking-tight">{assignment.task?.title}</h2>
    {assignment.location && (
      <p className="text-sm opacity-80 mb-1 flex items-center gap-1">
        <span>📍</span> {assignment.location}
      </p>
    )}
    <p className="text-sm opacity-80 mb-4">
      Until{" "}
      {new Date(assignment.endTime).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })}
    </p>
    <Badge status={assignment.status} />
  </div>
);

// ─── Free Card (hover lift + button scale) ────────────────────────────────────

const FreeCard = ({ onAssign }: { onAssign: () => void }) => (
  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-white">
    <p className="text-sm opacity-80 mb-1 flex items-center gap-1">
      <span>✅</span> Current status
    </p>
    <h2 className="text-2xl font-bold mb-1 tracking-tight">You are FREE 🟢</h2>
    <p className="text-sm opacity-80 mb-5">No active task assigned right now</p>
    <button
      onClick={onAssign}
      className="bg-white text-emerald-700 font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200"
    >
      Assign yourself a task →
    </button>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const SoldierDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((s: RootState) => s.auth);
  const { assignments, isLoading } = useSelector((s: RootState) => s.assignments);

  const fetchAssignments = async () => {
    dispatch(setAssignmentLoading(true));
    try {
      const res = await api.get<{ success: boolean; data: Assignment[] }>(
        `${API_ROUTES.SOLDIER}/assignments`
      );
      dispatch(setAssignments(res.data.data));
    } catch (err: unknown) {
      dispatch(setAssignmentError(extractError(err)));
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const now = new Date();

  const activeAssignment = assignments.find(
    (a) =>
      new Date(a.startTime) <= now &&
      new Date(a.endTime) >= now &&
      (a.status === "active" || a.status === "pending_review")
  ) as Assignment | undefined;

  const stats: StatCardProps[] = [
    {
      label: "Total Assignments",
      value: assignments.length,
      gradient: "bg-gradient-to-br from-slate-700 to-slate-800",
      icon: "📋",
    },
    {
      label: "Completed",
      value: assignments.filter((a) => a.status === "completed").length,
      gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
      icon: "✅",
    },
    {
      label: "Upcoming",
      value: assignments.filter((a) => a.status === "upcoming").length,
      gradient: "bg-gradient-to-br from-blue-500 to-indigo-600",
      icon: "📅",
    },
  ];

  const recentAssignments = [...assignments]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 5) as Assignment[];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-pulse">🏠</div>
          <p className="text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-7">
        {/* welcome header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Welcome, {user?.name} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            {user?.rank && `${user.rank}`}
            {user?.rank && user?.unit && " · "}
            {user?.unit && `${user.unit} Unit`}
          </p>
        </div>

        {/* active or free card with hover effects */}
        {activeAssignment ? (
          <ActiveTaskCard assignment={activeAssignment} />
        ) : (
          <FreeCard onAssign={() => navigate("/soldier/tasks")} />
        )}

        {/* stat cards - each lifts independently */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* recent assignments - items slide/hover */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100 p-6 transition-all duration-300 hover:shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-800">Recent Assignments</h2>
            <button
              onClick={() => navigate("/soldier/assignments")}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200 hover:underline"
            >
              View all →
            </button>
          </div>

          {!recentAssignments.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-sm font-medium">No assignments yet</p>
              <button
                onClick={() => navigate("/soldier/tasks")}
                className="mt-2 text-sm text-emerald-600 hover:underline font-medium transition-all hover:scale-105"
              >
                Browse available tasks
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAssignments.map((a) => (
                <div
                  key={a._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 transition-all duration-200 hover:bg-gray-100 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{a.task?.title}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(a.startTime).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SoldierDashboard;
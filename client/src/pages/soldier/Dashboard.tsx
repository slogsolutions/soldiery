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

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  bg: string;
}

const StatCard = ({ label, value, bg }: StatCardProps) => (
  <div className={`${bg} rounded-xl p-5 shadow`}>
    <p className="text-3xl font-bold text-white">{value}</p>
    <p className="text-sm text-white opacity-80 mt-1">{label}</p>
  </div>
);

// ─── Active Task Card ─────────────────────────────────────────────────────────

const ActiveTaskCard = ({ assignment }: { assignment: Assignment }) => (
  <div className="bg-blue-600 rounded-xl p-6 shadow text-white">
    <p className="text-sm opacity-80 mb-1">Currently on duty</p>
    <h2 className="text-2xl font-bold mb-2">{assignment.task?.title}</h2>
    {assignment.location && (
      <p className="text-sm opacity-80 mb-1">📍 {assignment.location}</p>
    )}
    <p className="text-sm opacity-80 mb-3">
      Until{" "}
      {new Date(assignment.endTime).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })}
    </p>
    <Badge status={assignment.status} />
  </div>
);

// ─── Free Card ───────────────────────────────────────────────────────────────

const FreeCard = ({ onAssign }: { onAssign: () => void }) => (
  <div className="bg-green-600 rounded-xl p-6 shadow text-white">
    <p className="text-sm opacity-80 mb-1">Current status</p>
    <h2 className="text-2xl font-bold mb-1">You are FREE 🟢</h2>
    <p className="text-sm opacity-80 mb-4">No active task assigned right now</p>
    <button
      onClick={onAssign}
      className="bg-white text-green-700 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-green-50 transition-all"
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
    { label: "Total Assignments", value: assignments.length, bg: "bg-gray-800" },
    {
      label: "Completed",
      value: assignments.filter((a) => a.status === "completed").length,
      bg: "bg-green-600",
    },
    {
      label: "Upcoming",
      value: assignments.filter((a) => a.status === "upcoming").length,
      bg: "bg-blue-600",
    },
  ];

  const recentAssignments = [...assignments]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 5) as Assignment[];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <div className="text-3xl mb-2">🏠</div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome, {user?.name} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {user?.rank && `${user.rank}`}
          {user?.rank && user?.unit && " · "}
          {user?.unit && `${user.unit} Unit`}
        </p>
      </div>

      {/* active or free card */}
      {activeAssignment ? (
        <ActiveTaskCard assignment={activeAssignment} />
      ) : (
        <FreeCard onAssign={() => navigate("/soldier/tasks")} />
      )}

      {/* stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* recent assignments */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Assignments</h2>
          <button
            onClick={() => navigate("/soldier/assignments")}
            className="text-green-600 text-sm hover:underline font-medium"
          >
            View all →
          </button>
        </div>

        {!recentAssignments.length ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-sm">No assignments yet</p>
            <button
              onClick={() => navigate("/soldier/tasks")}
              className="mt-2 text-green-600 text-sm hover:underline"
            >
              Browse available tasks
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAssignments.map((a) => (
              <div
                key={a._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
              >
                <div>
                  <p className="font-medium text-gray-800 text-sm">{a.task?.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
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
  );
};

export default SoldierDashboard;
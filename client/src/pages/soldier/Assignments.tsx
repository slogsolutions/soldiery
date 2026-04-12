import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import {
  setAssignments,
  updateAssignment,
  setAssignmentLoading,
  setAssignmentError,
} from "../../store/slices/assignmentSlice";
import api from "../../api/axios";
import { API_ROUTES } from "@/utils/constant";
import Badge from "../../components/ui/Badge";
import type { Assignment } from "../../store/slices/assignmentSlice";

// ─── Types ───────────────────────────────────────────────────────────────────

type AssignmentStatus =
  | "upcoming"
  | "active"
  | "pending_review"
  | "completed"
  | "rejected";

interface MarkDoneResponse {
  success: boolean;
  data: Assignment;
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "pending_review", label: "Pending Review" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const extractError = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const canMarkDone = (status: AssignmentStatus) =>
  status === "active" || status === "upcoming";

// ─── Assignment Card ──────────────────────────────────────────────────────────

interface AssignmentCardProps {
  assignment: Assignment;
  onMarkDone: (id: string) => void;
  marking: boolean;
}

const borderColor: Record<AssignmentStatus, string> = {
  active: "border-blue-500",
  completed: "border-green-500",
  pending_review: "border-orange-400",
  rejected: "border-red-400",
  upcoming: "border-gray-300",
};

const AssignmentCard = ({ assignment: a, onMarkDone, marking }: AssignmentCardProps) => (
  <div
    className={`bg-white rounded-xl shadow p-5 border-l-4 transition-all hover:shadow-md ${
      borderColor[a.status]
    }`}
  >
    {/* header */}
    <div className="flex items-start justify-between gap-2 mb-3">
      <div>
        <h3 className="font-semibold text-gray-800">{a.task?.title}</h3>
        <p className="text-xs text-gray-400 mt-0.5 capitalize">
          {a.createdBy === "manager"
            ? `Assigned by manager${a.assignedBy ? ` (${a.assignedBy.name})` : ""}`
            : "Self assigned"}
        </p>
      </div>
      <Badge status={a.status} />
    </div>

    {/* time */}
    <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs text-gray-600 space-y-1">
      <div className="flex justify-between">
        <span className="text-gray-400">Start</span>
        <span className="font-medium">{formatDate(a.startTime)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">End</span>
        <span className="font-medium">{formatDate(a.endTime)}</span>
      </div>
    </div>

    {/* extra info */}
    <div className="space-y-1 mb-4">
      {a.location && (
        <p className="text-xs text-gray-500">
          📍 <span className="font-medium">{a.location}</span>
        </p>
      )}
      {a.priority && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Priority:</span>
          <Badge status={a.priority} />
        </div>
      )}
      {a.notes && (
        <p className="text-xs text-gray-500">📝 {a.notes}</p>
      )}
    </div>

    {/* status messages */}
    {a.status === "pending_review" && (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
        <p className="text-xs text-orange-700 font-medium">
          ⏳ Waiting for manager approval
        </p>
      </div>
    )}
    {a.status === "rejected" && (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
        <p className="text-xs text-red-700 font-medium">
          ❌ Manager rejected — task is still ongoing
        </p>
      </div>
    )}
    {a.status === "completed" && (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
        <p className="text-xs text-green-700 font-medium">
          ✅ Task completed and approved
        </p>
      </div>
    )}

    {/* mark done */}
    {canMarkDone(a.status) && (
      <button
        onClick={() => onMarkDone(a._id)}
        disabled={marking}
        className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60 transition-all"
      >
        {marking ? "Submitting..." : "Mark as Done"}
      </button>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const SoldierAssignments = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { assignments, isLoading } = useSelector((s: RootState) => s.assignments);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [markingId, setMarkingId] = useState<string | null>(null);

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

  const handleMarkDone = async (id: string) => {
    setMarkingId(id);
    try {
      const res = await api.patch<MarkDoneResponse>(
        `${API_ROUTES.SOLDIER}/assignments/${id}/done`
      );
      dispatch(updateAssignment(res.data.data));
    } catch (err: unknown) {
      dispatch(setAssignmentError(extractError(err)));
    } finally {
      setMarkingId(null);
    }
  };

  const filteredAssignments = (assignments as Assignment[]).filter((a) =>
    statusFilter ? a.status === statusFilter : true
  );

  const counts = STATUS_FILTERS.reduce<Record<string, number>>((acc, f) => {
    acc[f.value] =
      f.value === ""
        ? assignments.length
        : assignments.filter((a) => a.status === f.value).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">

      {/* header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Assignments</h1>
        <p className="text-gray-500 text-sm mt-1">
          Track all your tasks and mark them done when complete
        </p>
      </div>

      {/* filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === f.value
                ? "bg-green-600 text-white"
                : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.label}
            {counts[f.value] > 0 && (
              <span
                className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                  statusFilter === f.value
                    ? "bg-white text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {counts[f.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <div className="text-3xl mb-2">📌</div>
          <p>Loading assignments...</p>
        </div>
      ) : !filteredAssignments.length ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-xl shadow text-gray-400">
          <div className="text-3xl mb-2">📌</div>
          <p className="text-sm">
            {statusFilter
              ? `No ${statusFilter.replace("_", " ")} assignments`
              : "No assignments yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((a) => (
            <AssignmentCard
              key={a._id}
              assignment={a}
              onMarkDone={handleMarkDone}
              marking={markingId === a._id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SoldierAssignments;
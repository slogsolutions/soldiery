import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../../store/store";
import { logout } from "../../store/slices/authSlice";
import { setAssignments, setAssignmentLoading, setAssignmentError } from "../../store/slices/assignmentSlice";
import type { Assignment } from "../../store/slices/assignmentSlice";
import { setLeaves, addLeave, setLeaveLoading, setLeaveError } from "../../store/slices/leaveSlice";
import type { Leave } from "../../store/slices/leaveSlice";
import api from "../../api/axios";
import { API_ROUTES } from "@/utils/constant";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import {
  ClipboardList,
  Clock,
  Calendar,
  Plus,
  AlertCircle,
  Activity,
  ChevronRight,
  MapPin,
  FileText,
  LogOut,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const extractError = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── Tab Types ────────────────────────────────────────────────────────────────

type ActiveTab = "tasks" | "leaves";

const ASSIGNMENT_STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "pending_review", label: "Pending Review" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

// ─── My Tasks Tab ─────────────────────────────────────────────────────────────

const MyTasksTab = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { assignments, isLoading } = useSelector((s: RootState) => s.assignments);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchAssignments = useCallback(async () => {
    dispatch(setAssignmentLoading(true));
    try {
      const res = await api.get<{ success: boolean; data: Assignment[] }>(
        `${API_ROUTES.SOLDIER}/assignments`
      );
      dispatch(setAssignments(res.data.data));
    } catch (err: unknown) {
      dispatch(setAssignmentError(extractError(err)));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filtered = (assignments as Assignment[]).filter(
    (a) => !statusFilter || a.status === statusFilter
  );

  return (
    <div className="space-y-6">
      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {ASSIGNMENT_STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all border ${
              statusFilter === f.value
                ? "bg-green-900/40 text-green-400 border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                : "bg-gray-900 text-gray-500 border-gray-800 hover:text-gray-300 hover:border-gray-700"
            }`}
          >
            {f.label}
            {(() => {
              const cnt = f.value === "" ? assignments.length : assignments.filter(a => a.status === f.value).length;
              return cnt > 0 ? (
                <span className="ml-1.5 bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-full text-[9px]">{cnt}</span>
              ) : null;
            })()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="p-20 text-center animate-pulse">
          <Activity size={40} className="text-green-500 mx-auto mb-4" />
          <p className="text-green-500/60 font-mono uppercase tracking-[0.2em] text-xs">Loading assignments...</p>
        </div>
      ) : !filtered.length ? (
        <div className="p-20 text-center">
          <ClipboardList size={48} className="text-gray-800 mx-auto mb-4 opacity-30" />
          <p className="text-gray-500 font-medium tracking-wide font-mono uppercase text-xs">
            {statusFilter ? `No ${statusFilter.replace(/_/g, " ")} assignments` : "No assignments yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => (
            <div
              key={a._id}
              className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5 hover:border-gray-700 transition-all backdrop-blur-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-white text-base tracking-wide">{a.task?.title}</h3>
                </div>
                <Badge status={a.status} />
              </div>

              {/* Timing */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-950/60 rounded-xl p-3 border border-gray-800/50">
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Start</p>
                  <p className="text-sm text-gray-300 font-mono font-semibold">{formatDateTime(a.startTime)}</p>
                </div>
                <div className="bg-gray-950/60 rounded-xl p-3 border border-gray-800/50">
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">End</p>
                  <p className="text-sm text-gray-300 font-mono font-semibold">{formatDateTime(a.endTime)}</p>
                </div>
              </div>

              {/* Extra metadata */}
              <div className="flex flex-wrap gap-3">
                {a.location && (
                  <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                    <MapPin size={12} className="text-gray-600" /> {a.location}
                  </span>
                )}
                {a.priority && (
                  <Badge status={a.priority} />
                )}
                {a.notes && (
                  <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                    <FileText size={12} className="text-gray-600" /> {a.notes}
                  </span>
                )}
              </div>

              {/* Status messages */}
              {a.status === "pending_review" && (
                <div className="mt-4 p-3 bg-orange-950/30 border border-orange-900/40 rounded-xl">
                  <p className="text-orange-400 text-xs font-semibold">⏳ Awaiting manager confirmation</p>
                </div>
              )}
              {a.status === "rejected" && (
                <div className="mt-4 p-3 bg-red-950/30 border border-red-900/40 rounded-xl">
                  <p className="text-red-400 text-xs font-semibold">❌ Manager review: Keep operational until reassigned</p>
                </div>
              )}
              {a.status === "completed" && (
                <div className="mt-4 flex items-center gap-2 text-green-500/80 px-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                  <p className="text-[10px] uppercase font-black tracking-widest italic opacity-60">Objective Secured</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Leaves Tab ──────────────────────────────────────────────────────────────

const LeavesTab = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { leaves, isLoading } = useSelector((s: RootState) => s.leaves);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ reason: "", otherReason: "", startDate: "", endDate: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchLeaves = useCallback(async () => {
    dispatch(setLeaveLoading(true));
    try {
      const res = await api.get("/api/leaves/soldier/leaves");
      dispatch(setLeaves(res.data.data));
    } catch (err: unknown) {
      dispatch(setLeaveError(extractError(err)));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    if (!form.reason) {
      setFormError("Please select a reason for leave.");
      setSubmitting(false);
      return;
    }

    if (form.reason === "Other" && !form.otherReason.trim()) {
      setFormError("Please specify your leave reason.");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason === "Other" ? form.otherReason.trim() : form.reason,
      };

      const res = await api.post("/api/leaves/soldier/leaves", payload);
      dispatch(addLeave(res.data.data));
      setShowModal(false);
      setForm({ reason: "", otherReason: "", startDate: "", endDate: "" });
    } catch (err: unknown) {
      setFormError((err as any).response?.data?.message || extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Apply Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-500 transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)]"
        >
          <Plus size={16} /> New Leave Application
        </button>
      </div>

      {/* Leave List */}
      {isLoading ? (
        <div className="p-20 text-center animate-pulse">
          <Activity size={40} className="text-green-500 mx-auto mb-4" />
          <p className="text-green-500/60 font-mono uppercase tracking-[0.2em] text-xs">Loading records...</p>
        </div>
      ) : !leaves.length ? (
        <div className="p-20 text-center">
          <Clock size={48} className="text-gray-800 mx-auto mb-4 opacity-30" />
          <p className="text-gray-500 font-medium tracking-wide font-mono uppercase text-xs">No leave requests on record</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaves.map((leave: Leave) => (
            <div
              key={leave._id}
              className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5 hover:border-gray-700 transition-all backdrop-blur-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 text-gray-300 font-mono text-sm">
                    {formatDate(leave.startDate)}
                    <ChevronRight size={14} className="text-gray-600" />
                    {formatDate(leave.endDate)}
                    <span className="ml-2 bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-xs border border-gray-700 font-bold">
                      {leave.finalDays || leave.originalDays}d
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1 italic">"{leave.reason}"</p>
                </div>
                <Badge status={leave.status} />
              </div>

              {/* Notes from chain of command */}
              {(leave.managerNote || leave.adminNote) && (
                <div className="mt-3 space-y-2">
                  {leave.managerNote && (
                    <div className="p-3 bg-orange-950/30 border border-orange-900/30 rounded-xl">
                      <p className="text-[10px] text-orange-500 uppercase font-bold tracking-widest mb-1">Unit Commander Note</p>
                      <p className="text-orange-300/80 text-xs">{leave.managerNote}</p>
                    </div>
                  )}
                  {leave.adminNote && (
                    <div className="p-3 bg-blue-950/30 border border-blue-900/30 rounded-xl">
                      <p className="text-[10px] text-blue-500 uppercase font-bold tracking-widest mb-1">HQ Note</p>
                      <p className="text-blue-300/80 text-xs">{leave.adminNote}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Apply Modal */}
      {showModal && (
        <Modal title="Apply for Leave" onClose={() => setShowModal(false)}>
          <form onSubmit={handleApply} className="space-y-5">
            {formError && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl flex items-center gap-2">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{formError}</p>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 tracking-widest uppercase">Reason *</label>
              <select
                required
                value={form.reason}
                onChange={(e) => setForm(p => ({
                  ...p,
                  reason: e.target.value,
                  otherReason: e.target.value === "Other" ? p.otherReason : "",
                }))}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
              >
                <option value="">Select reason</option>
                <option value="Medical">Medical</option>
                <option value="Family Emergency">Family Emergency</option>
                <option value="Personal Work">Personal Work</option>
                <option value="Marriage">Marriage</option>
                <option value="Training">Training</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {form.reason === "Other" && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 tracking-widest uppercase">Other Reason *</label>
                <textarea
                  required
                  value={form.otherReason}
                  onChange={(e) => setForm(p => ({ ...p, otherReason: e.target.value }))}
                  placeholder="Provide a custom reason for leave..."
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none"
                  rows={3}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 tracking-widest uppercase">Start Date *</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 tracking-widest uppercase">End Date *</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-500 disabled:opacity-60 transition-all shadow-[0_0_20px_rgba(34,197,94,0.15)]"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const SoldierDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((s: RootState) => s.auth);
  const [activeTab, setActiveTab] = useState<ActiveTab>("tasks");

  const tabs: { id: ActiveTab; label: string; icon: typeof ClipboardList }[] = [
    { id: "tasks", label: "My Assignments", icon: ClipboardList },
    { id: "leaves", label: "Leave Management", icon: Clock },
  ];

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      dispatch(logout());
      navigate("/login");
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800/60 pb-6 relative">
        <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-gradient-to-r from-green-500 to-transparent" />
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]" />
            <p className="text-green-500 text-xs tracking-[0.3em] uppercase font-mono">Operative Console</p>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            {user?.rank ? `${user.rank} ` : ""}{user?.name}
          </h1>
          <p className="text-gray-400 text-sm mt-1 font-mono tracking-widest">
            #{user?.armyNumber} {user?.unit ? `· ${user.unit}` : ""}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="flex items-center gap-2.5 bg-gray-900/60 border border-green-900/30 rounded-2xl px-4 py-3 backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse" />
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Connection</p>
              <p className="text-green-400 text-sm font-bold tracking-wide">SECURE — ONLINE</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-gray-900/60 p-1 rounded-2xl border border-gray-800/60 backdrop-blur-sm w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 ${
                isActive
                  ? "bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-300 shadow-[0_0_6px_rgba(134,239,172,0.8)]" />}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "tasks" && <MyTasksTab />}
        {activeTab === "leaves" && <LeavesTab />}
      </div>

    </div>
  );
};

export default SoldierDashboard;
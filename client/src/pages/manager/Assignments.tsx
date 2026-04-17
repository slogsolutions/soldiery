import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import {
  setAssignments, addAssignment, updateAssignment,
  setAssignmentLoading, setAssignmentError,
} from "../../store/slices/assignmentSlice";
import type { Assignment } from "../../store/slices/assignmentSlice";
import { setSoldiers, setSoldierLoading } from "../../store/slices/soldierSlice";
import type { Soldier } from "../../store/slices/soldierSlice";
import { setTasks, setTaskLoading } from "../../store/slices/taskSlice";
import type { Task } from "../../store/slices/taskSlice";
import api from "../../api/axios";
import { API_ROUTES } from "@/utils/constant";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";

// ─── Types ───────────────────────────────────────────────────────────────────

type Priority = "low" | "medium" | "high";
type AssignmentStatus = Assignment["status"];

interface AssignFormData {
  soldierId: string; taskId: string;
  startTime: string; endTime: string;
  notes: string; priority: Priority; location: string;
}

interface EditFormData {
  notes: string; priority: Priority; location: string;
  startTime: string; endTime: string;
}

const initialAssignForm: AssignFormData = {
  soldierId: "", taskId: "", startTime: "", endTime: "",
  notes: "", priority: "medium", location: "",
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All Status" },
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "pending_review", label: "Pending Review" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; accent: string }[] = [
  { value: "low", label: "Low", accent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { value: "medium", label: "Medium", accent: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { value: "high", label: "High", accent: "text-red-500 bg-red-500/10 border-red-500/20" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const extractError = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });

const toInputDateTime = (iso: string) => {
  const date = new Date(iso);
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// ─── Assign Form ──────────────────────────────────────────────────────────────

interface AssignFormProps {
  form: AssignFormData;
  soldiers: Soldier[];
  tasks: Task[];
  error: string | null;
  submitting: boolean;
  onChange: <K extends keyof AssignFormData>(field: K, value: AssignFormData[K]) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

const AssignForm = ({ form, soldiers, tasks, error, submitting, onChange, onSubmit, onCancel }: AssignFormProps) => (
  <form onSubmit={onSubmit} className="space-y-4">
    {error && (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    )}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Soldier *</label>
      <select value={form.soldierId} required
        onChange={(e) => onChange("soldierId", e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
      >
        <option value="">Select soldier</option>
        {soldiers.map((s) => (
          <option key={s._id} value={s._id}>{s.name} ({s.armyNumber})</option>
        ))}
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Task *</label>
      <select value={form.taskId} required
        onChange={(e) => onChange("taskId", e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
      >
        <option value="">Select task</option>
        {tasks.filter((t) => t.isActive).map((t) => (
          <option key={t._id} value={t._id}>{t.title}</option>
        ))}
      </select>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
        <input type="datetime-local" required value={form.startTime}
          onChange={(e) => onChange("startTime", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
        <input type="datetime-local" required value={form.endTime}
          onChange={(e) => onChange("endTime", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Set Priority</label>
        <div className="grid grid-cols-3 gap-2">
          {PRIORITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange("priority", option.value)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${option.accent} ${form.priority === option.value ? "border-opacity-100 shadow-lg" : "border-opacity-50 hover:border-opacity-100"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input type="text" value={form.location} placeholder="e.g. Northern Gate"
          onChange={(e) => onChange("location", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
      <textarea value={form.notes} rows={2} placeholder="Additional instructions..."
        onChange={(e) => onChange("notes", e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
      />
    </div>
    <div className="flex gap-3 pt-1">
      <button type="button" onClick={onCancel}
        className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 font-medium"
      >Cancel</button>
      <button type="submit" disabled={submitting}
        className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
      >{submitting ? "Assigning..." : "Assign Task"}</button>
    </div>
  </form>
);

// ─── Edit Form ────────────────────────────────────────────────────────────────

interface EditFormProps {
  form: EditFormData;
  error: string | null;
  submitting: boolean;
  onChange: <K extends keyof EditFormData>(field: K, value: EditFormData[K]) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

const EditForm = ({ form, error, submitting, onChange, onSubmit, onCancel }: EditFormProps) => (
  <form onSubmit={onSubmit} className="space-y-4">
    {error && (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    )}
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
        <input type="datetime-local" value={form.startTime}
          onChange={(e) => onChange("startTime", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
        <input type="datetime-local" value={form.endTime}
          onChange={(e) => onChange("endTime", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Set Priority</label>
        <div className="grid grid-cols-3 gap-2">
          {PRIORITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange("priority", option.value)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${option.accent} ${form.priority === option.value ? "border-opacity-100 shadow-lg" : "border-opacity-50 hover:border-opacity-100"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input type="text" value={form.location} placeholder="e.g. Northern Gate"
          onChange={(e) => onChange("location", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
      <textarea value={form.notes} rows={2}
        onChange={(e) => onChange("notes", e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
      />
    </div>
    <div className="flex gap-3 pt-1">
      <button type="button" onClick={onCancel}
        className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 font-medium"
      >Cancel</button>
      <button type="submit" disabled={submitting}
        className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
      >{submitting ? "Saving..." : "Update"}</button>
    </div>
  </form>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ManagerAssignments = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { assignments, isLoading } = useSelector((s: RootState) => s.assignments);
  const { soldiers } = useSelector((s: RootState) => s.soldiers);
  const { tasks } = useSelector((s: RootState) => s.tasks);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [assignForm, setAssignForm] = useState<AssignFormData>(initialAssignForm);
  const [editForm, setEditForm] = useState<EditFormData>({
    notes: "", priority: "medium", location: "", startTime: "", endTime: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchAssignments = async (filter: string) => {
    dispatch(setAssignmentLoading(true));
    try {
      const query = filter ? `?status=${filter}` : "";
      const res = await api.get<{ success: boolean; data: Assignment[] }>(
        `${API_ROUTES.MANAGER}/assignments${query}`
      );
      dispatch(setAssignments(res.data.data));
    } catch (err: unknown) {
      dispatch(setAssignmentError(extractError(err)));
    }
  };

  const fetchSoldiers = async () => {
    dispatch(setSoldierLoading(true));
    try {
      const res = await api.get<{ success: boolean; data: Soldier[] }>(
        `${API_ROUTES.MANAGER}/soldiers?status=active`
      );
      dispatch(setSoldiers(res.data.data));
    } catch (err: unknown) {
      console.error(extractError(err));
    }
  };

  const fetchTasks = async () => {
    dispatch(setTaskLoading(true));
    try {
      const res = await api.get<{ success: boolean; data: Task[] }>(
        `${API_ROUTES.MANAGER}/tasks`
      );
      dispatch(setTasks(res.data.data));
    } catch (err: unknown) {
      console.error(extractError(err));
    }
  };

  useEffect(() => {
    fetchAssignments(statusFilter);
    fetchSoldiers();
    fetchTasks();
  }, [statusFilter]);

  // ── assign handlers ──────────────────────────────────────────────────────

  const handleAssignChange = <K extends keyof AssignFormData>(
    field: K, value: AssignFormData[K]
  ) => setAssignForm((prev) => ({ ...prev, [field]: value }));

  const handleAssignSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setAssignError(null);
    try {
      const res = await api.post<{ success: boolean; data: Assignment }>(
        `${API_ROUTES.MANAGER}/assignments`, assignForm
      );
      dispatch(addAssignment(res.data.data));
      setShowAssignModal(false);
      setAssignForm(initialAssignForm);
    } catch (err: unknown) {
      setAssignError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ── edit handlers ────────────────────────────────────────────────────────

  const openEdit = (a: Assignment) => {
    setSelectedAssignment(a);
    setEditForm({
      notes: a.notes ?? "",
      priority: a.priority ?? "medium",
      location: a.location ?? "",
      startTime: toInputDateTime(a.startTime),
      endTime: toInputDateTime(a.endTime),
    });
    setEditError(null);
    setShowEditModal(true);
  };

  const handleEditChange = <K extends keyof EditFormData>(
    field: K, value: EditFormData[K]
  ) => setEditForm((prev) => ({ ...prev, [field]: value }));

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setSubmitting(true);
    setEditError(null);
    try {
      const res = await api.patch<{ success: boolean; data: Assignment }>(
        `${API_ROUTES.MANAGER}/assignments/${selectedAssignment._id}`, editForm
      );
      dispatch(updateAssignment(res.data.data));
      setShowEditModal(false);
      setSelectedAssignment(null);
    } catch (err: unknown) {
      setEditError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ── approve / reject ─────────────────────────────────────────────────────

  const handleApprove = async (id: string) => {
    try {
      const res = await api.patch<{ success: boolean; data: Assignment }>(
        `${API_ROUTES.MANAGER}/assignments/${id}/approve`
      );
      dispatch(updateAssignment(res.data.data));
    } catch (err: unknown) {
      alert(extractError(err));
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("Reject this completion? Soldier will remain on duty.")) return;
    try {
      const res = await api.patch<{ success: boolean; data: Assignment }>(
        `${API_ROUTES.MANAGER}/assignments/${id}/reject`
      );
      dispatch(updateAssignment(res.data.data));
    } catch (err: unknown) {
      alert(extractError(err));
    }
  };

  const pendingCount = assignments.filter((a) => a.status === "pending_review").length;

  const isEditable = (status: AssignmentStatus) =>
    !["completed", "rejected"].includes(status);

  return (
    <div className="space-y-6">

      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Assignments</h1>
          <p className="text-gray-500 text-sm mt-1">Assign tasks to soldiers and manage their progress</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <button onClick={() => { setAssignForm(initialAssignForm); setAssignError(null); setShowAssignModal(true); }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-all"
          >+ Assign Task</button>
        </div>
      </div>

      {/* pending review banner */}
      {pendingCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-orange-600 text-xl">📋</span>
          <p className="text-orange-800 text-sm font-medium">
            {pendingCount} assignment{pendingCount > 1 ? "s" : ""} waiting for your review
          </p>
        </div>
      )}

      {/* table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <div className="text-center"><div className="text-3xl mb-2">📌</div><p>Loading assignments...</p></div>
        </div>
      ) : !assignments.length ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-xl shadow text-gray-400">
          <div className="text-3xl mb-2">📌</div>
          <p className="text-sm">No assignments found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Soldier</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Task</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Time</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Priority</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">By</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assignments.map((a) => (
                  <tr key={a._id}
                    className={`hover:bg-gray-50 transition-colors ${
                      a.status === "pending_review" ? "bg-orange-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{a.soldier?.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{a.soldier?.armyNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-700 font-medium">{a.task?.title}</p>
                      {a.location && <p className="text-xs text-gray-400 mt-0.5">📍 {a.location}</p>}
                      {a.notes && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-32">📝 {a.notes}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      <p>{formatDate(a.startTime)}</p>
                      <p className="text-gray-400">→ {formatDate(a.endTime)}</p>
                    </td>
                    <td className="px-6 py-4">
                      {a.priority && <Badge status={a.priority} />}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        a.createdBy === "manager"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {a.createdBy}
                      </span>
                    </td>
                    <td className="px-6 py-4"><Badge status={a.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        {a.status === "pending_review" && (
                          <>
                            <button onClick={() => handleApprove(a._id)}
                              className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 font-medium"
                            >Approve</button>
                            <button onClick={() => handleReject(a._id)}
                              className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-600 font-medium"
                            >Reject</button>
                          </>
                        )}
                        {isEditable(a.status) && (
                          <button onClick={() => openEdit(a)}
                            className="border border-gray-300 text-gray-600 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50 font-medium"
                          >Edit</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Showing {assignments.length} assignment{assignments.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}

      {/* assign modal */}
      {showAssignModal && (
        <Modal title="Assign Task to Soldier" onClose={() => setShowAssignModal(false)}>
          <AssignForm
            form={assignForm} soldiers={soldiers} tasks={tasks}
            error={assignError} submitting={submitting}
            onChange={handleAssignChange}
            onSubmit={handleAssignSubmit}
            onCancel={() => setShowAssignModal(false)}
          />
        </Modal>
      )}

      {/* edit modal */}
      {showEditModal && selectedAssignment && (
        <Modal title="Edit Assignment" onClose={() => setShowEditModal(false)}>
          <EditForm
            form={editForm} error={editError} submitting={submitting}
            onChange={handleEditChange}
            onSubmit={handleEditSubmit}
            onCancel={() => setShowEditModal(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default ManagerAssignments;
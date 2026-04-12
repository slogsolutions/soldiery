import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import { setAssignments, addAssignment, updateAssignment, setAssignmentLoading, setAssignmentError } from "../../store/slices/assignmentSlice";
import api from "../../api/axios";
import { API_ROUTES } from "@/utils/constant";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";

// ─── Types ───────────────────────────────────────────────────────────────────

type AssignmentStatus = "upcoming" | "active" | "pending_review" | "completed" | "rejected";
type Priority = "low" | "medium" | "high";

interface Assignment {
  _id: string;
  soldier: { _id: string; name: string; armyNumber: string };
  task: { _id: string; title: string };
  startTime: string;
  endTime: string;
  status: AssignmentStatus;
  createdBy: "manager" | "soldier";
  notes?: string;
  priority?: Priority;
  location?: string;
}

interface Soldier {
  _id: string;
  name: string;
  armyNumber: string;
}

interface Task {
  _id: string;
  title: string;
  isActive: boolean;
}

interface AssignFormData {
  soldierId: string;
  taskId: string;
  startTime: string;
  endTime: string;
  notes: string;
  priority: Priority;
  location: string;
}

interface EditFormData {
  notes: string;
  priority: Priority;
  location: string;
  startTime: string;
  endTime: string;
}

interface SelectedAssignment {
  _id: string;
  notes?: string;
  priority?: Priority;
  location?: string;
  startTime: string;
  endTime: string;
  status: AssignmentStatus;
}

const initialAssignForm: AssignFormData = {
  soldierId: "", taskId: "", startTime: "", endTime: "",
  notes: "", priority: "medium", location: "",
};

const STATUS_FILTERS = [
  { value: "", label: "All Status" },
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "pending_review", label: "Pending Review" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const toInputDateTime = (iso: string) => new Date(iso).toISOString().slice(0, 16);

// ─── Assign Form ─────────────────────────────────────────────────────────────

interface AssignFormProps {
  form: AssignFormData;
  soldiers: Soldier[];
  tasks: Task[];
  onChange: <K extends keyof AssignFormData>(field: K, value: AssignFormData[K]) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
}

const AssignForm = ({ form, soldiers, tasks, onChange, onSubmit, onCancel, submitting, error }: AssignFormProps) => (
  <form onSubmit={onSubmit} className="space-y-4">
    {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Soldier *</label>
      <select value={form.soldierId} onChange={(e) => onChange("soldierId", e.target.value)} required
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
      >
        <option value="">Select soldier</option>
        {soldiers.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.armyNumber})</option>)}
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Task *</label>
      <select value={form.taskId} onChange={(e) => onChange("taskId", e.target.value)} required
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
      >
        <option value="">Select task</option>
        {tasks.filter((t) => t.isActive).map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
        <select value={form.priority} onChange={(e) => onChange("priority", e.target.value as Priority)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input type="text" value={form.location} onChange={(e) => onChange("location", e.target.value)}
          placeholder="e.g. Northern Gate"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
      <textarea value={form.notes} onChange={(e) => onChange("notes", e.target.value)}
        rows={2} placeholder="Additional instructions..."
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
  onChange: <K extends keyof EditFormData>(field: K, value: EditFormData[K]) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
}

const EditForm = ({ form, onChange, onSubmit, onCancel, submitting, error }: EditFormProps) => (
  <form onSubmit={onSubmit} className="space-y-4">
    {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
        <select value={form.priority} onChange={(e) => onChange("priority", e.target.value as Priority)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input type="text" value={form.location} onChange={(e) => onChange("location", e.target.value)}
          placeholder="e.g. Northern Gate"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
      <textarea value={form.notes} onChange={(e) => onChange("notes", e.target.value)} rows={2}
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

  // local state for soldiers/tasks dropdowns — no need to hit Redux store for these
  const [soldiers, setSoldiers] = useState<Soldier[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<SelectedAssignment | null>(null);
  const [assignForm, setAssignForm] = useState<AssignFormData>(initialAssignForm);
  const [editForm, setEditForm] = useState<EditFormData>({
    notes: "", priority: "medium", location: "", startTime: "", endTime: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // load assignments
  useEffect(() => {
    const load = async () => {
      dispatch(setAssignmentLoading(true));
      try {
        const query = statusFilter ? `?status=${statusFilter}` : "";
        const res = await api.get(`${API_ROUTES.MANAGER}/assignments${query}`);
        dispatch(setAssignments(res.data.data));
      } catch (err: unknown) {
        dispatch(setAssignmentError(err instanceof Error ? err.message : "Failed to fetch assignments"));
      }
    };
    load();
  }, [dispatch, statusFilter]);

  // load soldiers + tasks for dropdowns once on mount
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [solRes, taskRes] = await Promise.all([
          api.get(`${API_ROUTES.MANAGER}/soldiers?status=active`),
          api.get(`${API_ROUTES.MANAGER}/tasks`),
        ]);
        setSoldiers(solRes.data.data);
        setTasks(taskRes.data.data);
      } catch {
        // non-critical — forms will just show empty dropdowns
      }
    };
    loadDropdowns();
  }, []);

  const handleAssignChange = <K extends keyof AssignFormData>(field: K, value: AssignFormData[K]) => {
    setAssignForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAssignSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);
    try {
      const res = await api.post(`${API_ROUTES.MANAGER}/assignments`, assignForm);
      dispatch(addAssignment(res.data.data));
      setShowAssignModal(false);
      setAssignForm(initialAssignForm);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (a: SelectedAssignment) => {
    setSelectedAssignment(a);
    setEditForm({
      notes: a.notes ?? "",
      priority: a.priority ?? "medium",
      location: a.location ?? "",
      startTime: toInputDateTime(a.startTime),
      endTime: toInputDateTime(a.endTime),
    });
    setModalError(null);
    setShowEditModal(true);
  };

  const handleEditChange = <K extends keyof EditFormData>(field: K, value: EditFormData[K]) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setSubmitting(true);
    setModalError(null);
    try {
      const res = await api.patch(`${API_ROUTES.MANAGER}/assignments/${selectedAssignment._id}`, editForm);
      dispatch(updateAssignment(res.data.data));
      setShowEditModal(false);
      setSelectedAssignment(null);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Failed to update assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await api.patch(`${API_ROUTES.MANAGER}/assignments/${id}/approve`);
      dispatch(updateAssignment(res.data.data));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to approve");
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("Reject this completion? Soldier will remain on duty.")) return;
    try {
      const res = await api.patch(`${API_ROUTES.MANAGER}/assignments/${id}/reject`);
      dispatch(updateAssignment(res.data.data));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to reject");
    }
  };

  const pendingCount = assignments.filter((a: Assignment) => a.status === "pending_review").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Assignments</h1>
          <p className="text-gray-500 text-sm mt-1">Assign tasks to soldiers and manage their progress</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            {STATUS_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <button onClick={() => { setModalError(null); setShowAssignModal(true); }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-all"
          >+ Assign Task</button>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-orange-600 text-xl">📋</span>
          <p className="text-orange-800 text-sm font-medium">
            {pendingCount} assignment{pendingCount > 1 ? "s" : ""} waiting for your review
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <div className="text-center"><div className="text-3xl mb-2">📌</div><p>Loading assignments...</p></div>
        </div>
      ) : !assignments.length ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-xl shadow text-gray-400">
          <div className="text-3xl mb-2">📌</div>
          <p className="text-sm">No assignments found</p>
          <button onClick={() => setShowAssignModal(true)}
            className="mt-3 text-green-600 text-sm font-medium hover:underline"
          >Assign a task</button>
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
                {assignments.map((a: Assignment) => (
                  <tr key={a._id} className={`hover:bg-gray-50 transition-colors ${a.status === "pending_review" ? "bg-orange-50" : ""}`}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{a.soldier?.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{a.soldier?.armyNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-700 font-medium">{a.task?.title}</p>
                      {a.location && <p className="text-xs text-gray-400 mt-0.5">📍 {a.location}</p>}
                      {a.notes && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-32">📝 {a.notes}</p>}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      <p>{formatDate(a.startTime)}</p>
                      <p className="text-gray-400">→ {formatDate(a.endTime)}</p>
                    </td>
                    <td className="px-6 py-4">{a.priority && <Badge status={a.priority} />}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        a.createdBy === "manager" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                      }`}>{a.createdBy}</span>
                    </td>
                    <td className="px-6 py-4"><Badge status={a.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        {a.status === "pending_review" && (
                          <>
                            <button onClick={() => handleApprove(a._id)}
                              className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 font-medium transition-all"
                            >Approve</button>
                            <button onClick={() => handleReject(a._id)}
                              className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-600 font-medium transition-all"
                            >Reject</button>
                          </>
                        )}
                        {!["completed", "rejected"].includes(a.status) && (
                          <button onClick={() => openEdit({
                            _id: a._id, notes: a.notes, priority: a.priority,
                            location: a.location, startTime: a.startTime,
                            endTime: a.endTime, status: a.status,
                          })}
                            className="border border-gray-300 text-gray-600 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50 font-medium transition-all"
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

      {showAssignModal && (
        <Modal title="Assign Task to Soldier" onClose={() => setShowAssignModal(false)}>
          <AssignForm form={assignForm} soldiers={soldiers} tasks={tasks}
            onChange={handleAssignChange} onSubmit={handleAssignSubmit}
            onCancel={() => setShowAssignModal(false)} submitting={submitting} error={modalError}
          />
        </Modal>
      )}

      {showEditModal && selectedAssignment && (
        <Modal title="Edit Assignment" onClose={() => setShowEditModal(false)}>
          <EditForm form={editForm} onChange={handleEditChange} onSubmit={handleEditSubmit}
            onCancel={() => setShowEditModal(false)} submitting={submitting} error={modalError}
          />
        </Modal>
      )}
    </div>
  );
};

export default ManagerAssignments;
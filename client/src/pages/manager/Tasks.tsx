import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import {
  setTasks, addTask, updateTask, deactivateTask,
  setTaskLoading, setTaskError,
} from "../../store/slices/taskSlice";
import type { Task } from "../../store/slices/taskSlice";
import {
  setAssignments, addAssignment, updateAssignment,
  setAssignmentLoading, setAssignmentError,
} from "../../store/slices/assignmentSlice";
import type { Assignment } from "../../store/slices/assignmentSlice";
import { setSoldiers, setSoldierLoading } from "../../store/slices/soldierSlice";
import type { Soldier } from "../../store/slices/soldierSlice";
import api from "../../api/axios";
import { API_ROUTES } from "@/utils/constant";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import {
  ListChecks, Target, Plus, Pencil, Power, PowerOff,
  Clock, MapPin, StickyNote, ChevronRight, ShieldAlert,
  AlertCircle, CheckCircle2, XCircle, Filter,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type SubTab = "tasks" | "assignments";
type Priority = "low" | "medium" | "high";
type AssignmentStatus = Assignment["status"];

interface TaskFormData { title: string; description: string; }
interface EditingTask { _id: string; title: string; description?: string; }
const initialTaskForm: TaskFormData = { title: "", description: "" };

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
// ─── Task Card (Dark Theme) ─────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  onEdit: (task: EditingTask) => void;
  onDeactivate: (id: string) => void;
}

const TaskCard = ({ task, onEdit, onDeactivate }: TaskCardProps) => (
  <div className={`bg-gray-900/60 rounded-2xl border p-5 transition-all hover:bg-gray-900/80 group backdrop-blur-md ${
    task.isActive
      ? "border-green-900/40 shadow-[0_0_15px_rgba(34,197,94,0.05)]"
      : "border-gray-800 opacity-50"
  }`}>
    <div className="flex items-start justify-between mb-3 gap-2">
      <h3 className="font-bold text-white text-sm leading-snug tracking-wide">{task.title}</h3>
      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-widest uppercase flex-shrink-0 border ${
        task.isActive
          ? "bg-green-500/10 text-green-400 border-green-500/20"
          : "bg-gray-800 text-gray-500 border-gray-700"
      }`}>
        {task.isActive ? "Active" : "Inactive"}
      </span>
    </div>
    {task.description && (
      <p className="text-sm text-gray-400 mb-3 leading-relaxed">{task.description}</p>
    )}
    {task.createdBy && (
      <div className="flex items-center gap-1.5 mb-4">
        <span className="text-[10px] text-gray-500 font-mono tracking-wider">CREATED BY</span>
        <span className="text-[10px] text-gray-300 font-semibold">{task.createdBy.name}</span>
        {task.createdBy.rank && (
          <span className="text-[10px] text-blue-400/70 font-mono">({task.createdBy.rank})</span>
        )}
      </div>
    )}
    <div className="flex gap-2 pt-1">
      <button
        onClick={() => onEdit({ _id: task._id, title: task.title, description: task.description })}
        className="flex-1 border border-gray-700 text-gray-300 text-xs py-2 rounded-xl hover:bg-gray-800 hover:text-white font-semibold transition-all flex items-center justify-center gap-1.5 tracking-wide"
      >
        <Pencil size={12} /> Edit
      </button>
      {task.isActive && (
        <button
          onClick={() => onDeactivate(task._id)}
          className="flex-1 border border-red-900/40 text-red-400/80 text-xs py-2 rounded-xl hover:bg-red-950/30 hover:text-red-300 font-semibold transition-all flex items-center justify-center gap-1.5 tracking-wide"
        >
          <PowerOff size={12} /> Deactivate
        </button>
      )}
    </div>
  </div>
);

// ─── Task Create/Edit Form (Dark Theme) ──────────────────────────────────────

interface TaskFormProps {
  form: TaskFormData;
  onChange: (field: keyof TaskFormData, value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  isEditing: boolean;
  loading: boolean;
  error: string | null;
}

const TaskForm = ({ form, onChange, onSubmit, onCancel, isEditing, loading, error }: TaskFormProps) => (
  <form onSubmit={onSubmit} className="space-y-4">
    {error && (
      <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl flex items-center gap-2">
        <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )}
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-1.5 tracking-widest uppercase">Title *</label>
      <input
        type="text" value={form.title} required
        onChange={(e) => onChange("title", e.target.value)}
        placeholder="e.g. Border Patrol"
        className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
      />
    </div>
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-1.5 tracking-widest uppercase">Description</label>
      <textarea
        value={form.description} rows={3}
        onChange={(e) => onChange("description", e.target.value)}
        placeholder="Optional — describe what this task involves..."
        className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 resize-none transition-all"
      />
    </div>
    <div className="flex gap-3 pt-1">
      <button type="button" onClick={onCancel}
        className="flex-1 border border-gray-700 text-gray-300 py-2.5 rounded-xl text-sm hover:bg-gray-800 font-semibold tracking-wide transition-all"
      >Cancel</button>
      <button type="submit" disabled={loading}
        className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-500 disabled:opacity-60 tracking-wide transition-all shadow-[0_0_20px_rgba(34,197,94,0.15)]"
      >{loading ? "Saving..." : isEditing ? "Update Task" : "Create Task"}</button>
    </div>
  </form>
);

// ─── Assign Form (Dark Theme) ────────────────────────────────────────────────

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

const selectClasses = "w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all appearance-none";
const inputClasses = "w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all";
const labelClasses = "block text-xs font-semibold text-gray-400 mb-1.5 tracking-widest uppercase";

const AssignForm = ({ form, soldiers, tasks, error, submitting, onChange, onSubmit, onCancel }: AssignFormProps) => (
  <form onSubmit={onSubmit} className="space-y-4">
    {error && (
      <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl flex items-center gap-2">
        <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )}
    <div>
      <label className={labelClasses}>Soldier *</label>
      <select value={form.soldierId} required
        onChange={(e) => onChange("soldierId", e.target.value)}
        className={selectClasses}
      >
        <option value="">Select soldier</option>
        {soldiers.map((s) => (
          <option key={s._id} value={s._id}>{s.name} ({s.armyNumber})</option>
        ))}
      </select>
    </div>
    <div>
      <label className={labelClasses}>Task *</label>
      <select value={form.taskId} required
        onChange={(e) => onChange("taskId", e.target.value)}
        className={selectClasses}
      >
        <option value="">Select task</option>
        {tasks.filter((t) => t.isActive).map((t) => (
          <option key={t._id} value={t._id}>{t.title}</option>
        ))}
      </select>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={labelClasses}>Start Time *</label>
        <input type="datetime-local" required value={form.startTime}
          onChange={(e) => onChange("startTime", e.target.value)}
          className={inputClasses}
        />
      </div>
      <div>
        <label className={labelClasses}>End Time *</label>
        <input type="datetime-local" required value={form.endTime}
          onChange={(e) => onChange("endTime", e.target.value)}
          className={inputClasses}
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={labelClasses}>Priority</label>
        <select value={form.priority}
          onChange={(e) => onChange("priority", e.target.value as Priority)}
          className={selectClasses}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div>
        <label className={labelClasses}>Location</label>
        <input type="text" value={form.location} placeholder="e.g. Northern Gate"
          onChange={(e) => onChange("location", e.target.value)}
          className={inputClasses}
        />
      </div>
    </div>
    <div>
      <label className={labelClasses}>Notes</label>
      <textarea value={form.notes} rows={2} placeholder="Additional instructions..."
        onChange={(e) => onChange("notes", e.target.value)}
        className={`${inputClasses} resize-none`}
      />
    </div>
    <div className="flex gap-3 pt-1">
      <button type="button" onClick={onCancel}
        className="flex-1 border border-gray-700 text-gray-300 py-2.5 rounded-xl text-sm hover:bg-gray-800 font-semibold tracking-wide transition-all"
      >Cancel</button>
      <button type="submit" disabled={submitting}
        className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-500 disabled:opacity-60 tracking-wide transition-all shadow-[0_0_20px_rgba(34,197,94,0.15)]"
      >{submitting ? "Assigning..." : "Assign Task"}</button>
    </div>
  </form>
);

// ─── Edit Assignment Form (Dark Theme) ───────────────────────────────────────

interface EditFormProps {
  form: EditFormData;
  error: string | null;
  submitting: boolean;
  onChange: <K extends keyof EditFormData>(field: K, value: EditFormData[K]) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

const EditAssignmentForm = ({ form, error, submitting, onChange, onSubmit, onCancel }: EditFormProps) => (
  <form onSubmit={onSubmit} className="space-y-4">
    {error && (
      <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl flex items-center gap-2">
        <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )}
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={labelClasses}>Start Time</label>
        <input type="datetime-local" value={form.startTime}
          onChange={(e) => onChange("startTime", e.target.value)}
          className={inputClasses}
        />
      </div>
      <div>
        <label className={labelClasses}>End Time</label>
        <input type="datetime-local" value={form.endTime}
          onChange={(e) => onChange("endTime", e.target.value)}
          className={inputClasses}
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={labelClasses}>Priority</label>
        <select value={form.priority}
          onChange={(e) => onChange("priority", e.target.value as Priority)}
          className={selectClasses}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div>
        <label className={labelClasses}>Location</label>
        <input type="text" value={form.location} placeholder="e.g. Northern Gate"
          onChange={(e) => onChange("location", e.target.value)}
          className={inputClasses}
        />
      </div>
    </div>
    <div>
      <label className={labelClasses}>Notes</label>
      <textarea value={form.notes} rows={2}
        onChange={(e) => onChange("notes", e.target.value)}
        className={`${inputClasses} resize-none`}
      />
    </div>
    <div className="flex gap-3 pt-1">
      <button type="button" onClick={onCancel}
        className="flex-1 border border-gray-700 text-gray-300 py-2.5 rounded-xl text-sm hover:bg-gray-800 font-semibold tracking-wide transition-all"
      >Cancel</button>
      <button type="submit" disabled={submitting}
        className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-500 disabled:opacity-60 tracking-wide transition-all shadow-[0_0_20px_rgba(34,197,94,0.15)]"
      >{submitting ? "Saving..." : "Update"}</button>
    </div>
  </form>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ManagerTasks = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, isLoading: tasksLoading } = useSelector((s: RootState) => s.tasks);
  const { assignments, isLoading: assignmentsLoading } = useSelector((s: RootState) => s.assignments);
  const { soldiers } = useSelector((s: RootState) => s.soldiers);

  // ── Sub-tab state ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<SubTab>("tasks");

  // ── Task form state ──────────────────────────────────────────────────────
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<EditingTask | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormData>(initialTaskForm);
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [taskFormError, setTaskFormError] = useState<string | null>(null);

  // ── Assignment form state ────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [assignForm, setAssignForm] = useState<AssignFormData>(initialAssignForm);
  const [editForm, setEditForm] = useState<EditFormData>({
    notes: "", priority: "medium", location: "", startTime: "", endTime: "",
  });
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchTasks = async () => {
    dispatch(setTaskLoading(true));
    try {
      const res = await api.get<{ success: boolean; data: Task[] }>(
        `${API_ROUTES.MANAGER}/tasks`
      );
      dispatch(setTasks(res.data.data));
    } catch (err: unknown) {
      dispatch(setTaskError(extractError(err)));
    }
  };

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

  useEffect(() => {
    fetchTasks();
    fetchSoldiers();
  }, []);

  useEffect(() => {
    fetchAssignments(statusFilter);
  }, [statusFilter]);

  // ── Task Handlers ────────────────────────────────────────────────────────

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskForm(initialTaskForm);
    setTaskFormError(null);
    setShowTaskModal(true);
  };

  const openEditTask = (task: EditingTask) => {
    setEditingTask(task);
    setTaskForm({ title: task.title, description: task.description ?? "" });
    setTaskFormError(null);
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
    setTaskForm(initialTaskForm);
    setTaskFormError(null);
  };

  const handleTaskSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTaskSubmitting(true);
    setTaskFormError(null);
    try {
      if (editingTask) {
        const res = await api.patch<{ success: boolean; data: Task }>(
          `${API_ROUTES.MANAGER}/tasks/${editingTask._id}`, taskForm
        );
        dispatch(updateTask(res.data.data));
      } else {
        const res = await api.post<{ success: boolean; data: Task }>(
          `${API_ROUTES.MANAGER}/tasks`, taskForm
        );
        dispatch(addTask(res.data.data));
      }
      closeTaskModal();
    } catch (err: unknown) {
      setTaskFormError(extractError(err));
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm("Deactivate this task? Soldiers won't see it, but existing assignments are preserved.")) return;
    try {
      await api.delete(`${API_ROUTES.MANAGER}/tasks/${id}`);
      dispatch(deactivateTask(id));
    } catch (err: unknown) {
      alert(extractError(err));
    }
  };

  // ── Assignment Handlers ──────────────────────────────────────────────────

  const handleAssignChange = <K extends keyof AssignFormData>(
    field: K, value: AssignFormData[K]
  ) => setAssignForm((prev) => ({ ...prev, [field]: value }));

  const handleAssignSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAssignSubmitting(true);
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
      setAssignSubmitting(false);
    }
  };

  const openEditAssignment = (a: Assignment) => {
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
    setAssignSubmitting(true);
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
      setAssignSubmitting(false);
    }
  };

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

  // ── Computed ─────────────────────────────────────────────────────────────

  const activeTasks = tasks.filter((t) => t.isActive);
  const inactiveTasks = tasks.filter((t) => !t.isActive);
  const pendingCount = assignments.filter((a) => a.status === "pending_review").length;
  const isEditable = (status: AssignmentStatus) => !["completed", "rejected"].includes(status);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800/60 pb-6 relative">
        <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-gradient-to-r from-green-500 to-transparent"></div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></span>
            <p className="text-green-500 text-xs tracking-[0.3em] uppercase font-mono">Task Command</p>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">Tasks</h1>
          <p className="text-gray-400 text-sm mt-1">Create tasks and assign them to soldiers with schedules</p>
        </div>
      </div>

      {/* Sub-tab Switcher */}
      <div className="flex items-center gap-1 bg-gray-900/60 p-1 rounded-2xl border border-gray-800/60 w-fit backdrop-blur-md">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 tracking-wide ${
            activeTab === "tasks"
              ? "bg-green-900/30 text-green-400 border border-green-900/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
              : "text-gray-400 hover:text-white hover:bg-gray-800/50 border border-transparent"
          }`}
        >
          <ListChecks size={16} /> My Tasks
          <span className="bg-gray-800 text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-full ml-1 border border-gray-700">
            {tasks.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("assignments")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 tracking-wide ${
            activeTab === "assignments"
              ? "bg-green-900/30 text-green-400 border border-green-900/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
              : "text-gray-400 hover:text-white hover:bg-gray-800/50 border border-transparent"
          }`}
        >
          <Target size={16} /> Assignments
          {pendingCount > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-1 animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* ════════════════════════ MY TASKS TAB ════════════════════════ */}
      {activeTab === "tasks" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Stats + Action */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-4">
              <div className="bg-gray-900/40 border border-green-900/30 rounded-2xl p-4 backdrop-blur-md min-w-[100px]">
                <p className="text-2xl font-black text-green-400 tracking-tighter">{activeTasks.length}</p>
                <p className="text-[10px] text-green-500/70 mt-1 font-semibold tracking-widest uppercase">Active</p>
              </div>
              <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4 backdrop-blur-md min-w-[100px]">
                <p className="text-2xl font-black text-gray-400 tracking-tighter">{inactiveTasks.length}</p>
                <p className="text-[10px] text-gray-500 mt-1 font-semibold tracking-widest uppercase">Inactive</p>
              </div>
            </div>
            <button onClick={openCreateTask}
              className="group relative overflow-hidden bg-green-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-green-500 transition-all flex items-center gap-2 tracking-wide shadow-[0_0_25px_rgba(34,197,94,0.2)]"
            >
              <Plus size={16} /> New Task
            </button>
          </div>

          {/* Task Cards */}
          {tasksLoading ? (
            <div className="flex flex-col items-center justify-center h-48">
              <ShieldAlert className="w-12 h-12 text-green-500 animate-pulse" />
              <p className="mt-4 text-green-400/80 font-mono tracking-[0.2em] uppercase text-xs animate-pulse">
                Loading Tasks...
              </p>
            </div>
          ) : !tasks.length ? (
            <div className="flex flex-col items-center justify-center h-48 bg-gray-900/40 rounded-2xl border border-gray-800 text-gray-500">
              <ListChecks size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-bold tracking-wider">NO TASKS YET</p>
              <button onClick={openCreateTask} className="mt-3 text-green-400 text-sm font-semibold hover:text-green-300 transition-colors">
                Create your first task
              </button>
            </div>
          ) : (
            <>
              {activeTasks.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <Power size={12} className="text-green-500" /> Active ({activeTasks.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeTasks.map((task) => (
                      <TaskCard key={task._id} task={task} onEdit={openEditTask} onDeactivate={handleDeactivate} />
                    ))}
                  </div>
                </div>
              )}
              {inactiveTasks.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xs font-bold text-gray-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <PowerOff size={12} className="text-gray-600" /> Inactive ({inactiveTasks.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inactiveTasks.map((task) => (
                      <TaskCard key={task._id} task={task} onEdit={openEditTask} onDeactivate={handleDeactivate} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ════════════════════════ ASSIGNMENTS TAB ════════════════════════ */}
      {activeTab === "assignments" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <select value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-gray-900/60 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500/50 appearance-none backdrop-blur-md"
                >
                  {STATUS_FILTERS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <button onClick={() => { setAssignForm(initialAssignForm); setAssignError(null); setShowAssignModal(true); }}
              className="group relative overflow-hidden bg-green-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-green-500 transition-all flex items-center gap-2 tracking-wide shadow-[0_0_25px_rgba(34,197,94,0.2)]"
            >
              <Target size={16} /> Assign Task
            </button>
          </div>

          {/* Pending Review Banner */}
          {pendingCount > 0 && (
            <div className="bg-orange-950/30 border border-orange-900/40 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Clock size={16} className="text-orange-400" />
              </div>
              <p className="text-orange-300 text-sm font-semibold tracking-wide">
                {pendingCount} assignment{pendingCount > 1 ? "s" : ""} waiting for your review
              </p>
            </div>
          )}

          {/* Assignment Table */}
          {assignmentsLoading ? (
            <div className="flex flex-col items-center justify-center h-48">
              <ShieldAlert className="w-12 h-12 text-green-500 animate-pulse" />
              <p className="mt-4 text-green-400/80 font-mono tracking-[0.2em] uppercase text-xs animate-pulse">
                Loading Assignments...
              </p>
            </div>
          ) : !assignments.length ? (
            <div className="flex flex-col items-center justify-center h-48 bg-gray-900/40 rounded-2xl border border-gray-800 text-gray-500">
              <Target size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-bold tracking-wider">NO ASSIGNMENTS FOUND</p>
            </div>
          ) : (
            <div className="bg-gray-900/40 rounded-2xl border border-gray-800/80 overflow-hidden backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800/60 bg-gray-900/50">
                      <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Soldier</th>
                      <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Task</th>
                      <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Time</th>
                      <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Priority</th>
                      <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">By</th>
                      <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Status</th>
                      <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40">
                    {assignments.map((a) => (
                      <tr key={a._id}
                        className={`hover:bg-gray-800/30 transition-colors ${
                          a.status === "pending_review" ? "bg-orange-950/10" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-white text-sm">{a.soldier?.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5">#{a.soldier?.armyNumber}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-200 font-semibold text-sm">{a.task?.title}</p>
                          {a.location && (
                            <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                              <MapPin size={10} /> {a.location}
                            </p>
                          )}
                          {a.notes && (
                            <p className="text-[10px] text-gray-500 mt-0.5 truncate max-w-32 flex items-center gap-1">
                              <StickyNote size={10} /> {a.notes}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <p className="text-gray-300">{formatDate(a.startTime)}</p>
                          <p className="text-gray-500 flex items-center gap-1">
                            <ChevronRight size={10} /> {formatDate(a.endTime)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {a.priority && <Badge status={a.priority} />}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-widest uppercase border ${
                            a.createdBy === "manager"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                              : "bg-gray-800 text-gray-400 border-gray-700"
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
                                  className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-500 font-semibold tracking-wide transition-all flex items-center gap-1"
                                >
                                  <CheckCircle2 size={12} /> Approve
                                </button>
                                <button onClick={() => handleReject(a._id)}
                                  className="bg-red-600/80 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-500 font-semibold tracking-wide transition-all flex items-center gap-1"
                                >
                                  <XCircle size={12} /> Reject
                                </button>
                              </>
                            )}
                            {isEditable(a.status) && (
                              <button onClick={() => openEditAssignment(a)}
                                className="border border-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-800 hover:text-white font-semibold tracking-wide transition-all flex items-center gap-1"
                              >
                                <Pencil size={12} /> Edit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 bg-gray-900/60 border-t border-gray-800/40">
                <p className="text-[10px] text-gray-500 tracking-widest font-mono uppercase">
                  Showing {assignments.length} assignment{assignments.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════ MODALS ════════════════════════ */}

      {/* Task Create/Edit Modal */}
      {showTaskModal && (
        <Modal title={editingTask ? "Edit Task" : "Create New Task"} onClose={closeTaskModal}>
          <TaskForm
            form={taskForm}
            onChange={(field, value) => setTaskForm((prev) => ({ ...prev, [field]: value }))}
            onSubmit={handleTaskSubmit}
            onCancel={closeTaskModal}
            isEditing={editingTask !== null}
            loading={taskSubmitting}
            error={taskFormError}
          />
        </Modal>
      )}

      {/* Assign Task Modal */}
      {showAssignModal && (
        <Modal title="Assign Task to Soldier" onClose={() => setShowAssignModal(false)}>
          <AssignForm
            form={assignForm} soldiers={soldiers} tasks={tasks}
            error={assignError} submitting={assignSubmitting}
            onChange={handleAssignChange}
            onSubmit={handleAssignSubmit}
            onCancel={() => setShowAssignModal(false)}
          />
        </Modal>
      )}

      {/* Edit Assignment Modal */}
      {showEditModal && selectedAssignment && (
        <Modal title="Edit Assignment" onClose={() => setShowEditModal(false)}>
          <EditAssignmentForm
            form={editForm} error={editError} submitting={assignSubmitting}
            onChange={handleEditChange}
            onSubmit={handleEditSubmit}
            onCancel={() => setShowEditModal(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default ManagerTasks;
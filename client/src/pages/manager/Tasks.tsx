import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import { setTasks, addTask, updateTask, deactivateTask, setTaskLoading, setTaskError } from "../../store/slices/taskSlice";
import api from "../../api/axios";
import { API_ROUTES } from "@/utils/constant";
import Modal from "../../components/ui/Modal";
import type { Task } from "../../store/slices/taskSlice";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TaskFormData {
  title: string;
  description: string;
}

interface EditingTask {
  _id: string;
  title: string;
  description?: string;
}

const initialForm: TaskFormData = { title: "", description: "" };

// ─── Task Card ───────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  onEdit: (task: EditingTask) => void;
  onDeactivate: (id: string) => void;
}

const TaskCard = ({ task, onEdit, onDeactivate }: TaskCardProps) => (
  <div className={`bg-white rounded-xl shadow p-5 border-l-4 transition-all hover:shadow-md ${
    task.isActive ? "border-green-500" : "border-gray-300 opacity-60"
  }`}>
    <div className="flex items-start justify-between mb-2 gap-2">
      <h3 className="font-semibold text-gray-800 text-sm leading-snug">{task.title}</h3>
      <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
        task.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
      }`}>
        {task.isActive ? "Active" : "Inactive"}
      </span>
    </div>
    {task.description && (
      <p className="text-sm text-gray-500 mb-3 leading-relaxed">{task.description}</p>
    )}
    <div className="flex items-center gap-1 mb-4">
      <span className="text-xs text-gray-400">Created by</span>
      <span className="text-xs text-gray-600 font-medium">{task.createdBy?.name ?? "—"}</span>
      {task.createdBy?.rank && (
        <span className="text-xs text-gray-400">({task.createdBy.rank})</span>
      )}
    </div>
    <div className="flex gap-2">
      <button
        onClick={() => onEdit({ _id: task._id, title: task.title, description: task.description })}
        className="flex-1 border border-gray-300 text-gray-600 text-xs py-2 rounded-lg hover:bg-gray-50 font-medium transition-all"
      >Edit</button>
      {task.isActive && (
        <button
          onClick={() => onDeactivate(task._id)}
          className="flex-1 border border-red-300 text-red-600 text-xs py-2 rounded-lg hover:bg-red-50 font-medium transition-all"
        >Deactivate</button>
      )}
    </div>
  </div>
);

// ─── Task Form ───────────────────────────────────────────────────────────────

interface TaskFormProps {
  form: TaskFormData;
  onChange: (field: keyof TaskFormData, value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  isEditing: boolean;
  loading: boolean;
}

const TaskForm = ({ form, onChange, onSubmit, onCancel, isEditing, loading }: TaskFormProps) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
      <input type="text" value={form.title} onChange={(e) => onChange("title", e.target.value)}
        required placeholder="e.g. Border Patrol"
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
      <textarea value={form.description} onChange={(e) => onChange("description", e.target.value)}
        rows={3} placeholder="Optional — describe what this task involves..."
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
      />
    </div>
    <div className="flex gap-3 pt-1">
      <button type="button" onClick={onCancel}
        className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 font-medium"
      >Cancel</button>
      <button type="submit" disabled={loading}
        className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
      >{loading ? "Saving..." : isEditing ? "Update Task" : "Create Task"}</button>
    </div>
  </form>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ManagerTasks = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, isLoading } = useSelector((s: RootState) => s.tasks);

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<EditingTask | null>(null);
  const [form, setForm] = useState<TaskFormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      dispatch(setTaskLoading(true));
      try {
        const res = await api.get(`${API_ROUTES.MANAGER}/tasks`);
        dispatch(setTasks(res.data.data));
      } catch (err: unknown) {
        dispatch(setTaskError(err instanceof Error ? err.message : "Failed to fetch tasks"));
      }
    };
    load();
  }, [dispatch]);

  const openCreate = () => { setEditingTask(null); setForm(initialForm); setShowModal(true); };
  const openEdit = (task: EditingTask) => {
    setEditingTask(task);
    setForm({ title: task.title, description: task.description ?? "" });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingTask(null); setForm(initialForm); setError(null); };

  const handleFieldChange = (field: keyof TaskFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (editingTask) {
        const res = await api.patch(`${API_ROUTES.MANAGER}/tasks/${editingTask._id}`, form);
        dispatch(updateTask(res.data.data));
      } else {
        const res = await api.post(`${API_ROUTES.MANAGER}/tasks`, form);
        dispatch(addTask(res.data.data));
      }
      closeModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm("Deactivate this task? Soldiers won't be able to see it, but existing assignments are preserved.")) return;
    try {
      await api.delete(`${API_ROUTES.MANAGER}/tasks/${id}`);
      dispatch(deactivateTask(id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to deactivate task");
    }
  };

  const activeTasks = tasks.filter((t) => t.isActive);
  const inactiveTasks = tasks.filter((t) => !t.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage the approved task list for soldiers</p>
        </div>
        <button onClick={openCreate}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-all"
        >+ New Task</button>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-xs">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-700">{activeTasks.length}</p>
          <p className="text-xs text-green-600 mt-1">Active tasks</p>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-600">{inactiveTasks.length}</p>
          <p className="text-xs text-gray-500 mt-1">Inactive tasks</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <div className="text-center"><div className="text-3xl mb-2">📋</div><p>Loading tasks...</p></div>
        </div>
      ) : !tasks.length ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-xl shadow text-gray-400">
          <div className="text-3xl mb-2">📋</div>
          <p className="text-sm">No tasks yet</p>
          <button onClick={openCreate} className="mt-3 text-green-600 text-sm font-medium hover:underline">
            Create your first task
          </button>
        </div>
      ) : (
        <>
          {activeTasks.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Active ({activeTasks.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTasks.map((task) => (
                  <TaskCard key={task._id} task={task} onEdit={openEdit} onDeactivate={handleDeactivate} />
                ))}
              </div>
            </div>
          )}
          {inactiveTasks.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Inactive ({inactiveTasks.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inactiveTasks.map((task) => (
                  <TaskCard key={task._id} task={task} onEdit={openEdit} onDeactivate={handleDeactivate} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <Modal title={editingTask ? "Edit Task" : "Create New Task"} onClose={closeModal}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}
          <TaskForm form={form} onChange={handleFieldChange} onSubmit={handleSubmit}
            onCancel={closeModal} isEditing={editingTask !== null} loading={submitting}
          />
        </Modal>
      )}
    </div>
  );
};

export default ManagerTasks;
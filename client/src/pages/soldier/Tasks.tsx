import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import { setTasks, setTaskLoading, setTaskError } from "../../store/slices/taskSlice";
import {
  addAssignment,
  setAssignmentError,
  setAssignmentLoading,
} from "../../store/slices/assignmentSlice";
import api from "../../api/axios";
import { API_ROUTES } from "@/utils/constant";
import Modal from "../../components/ui/Modal";
import type { Assignment } from "../../store/slices/assignmentSlice";
import type { Task } from "../../store/slices/taskSlice";


interface SelfAssignFormData {
  startTime: string;
  endTime: string;
}

interface SelfAssignResponse {
  success: boolean;
  data: Assignment;
}


const initialForm: SelfAssignFormData = { startTime: "", endTime: "" };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const extractError = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
};

// ─── Task Card ───────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
}

const TaskCard = ({ task, onSelect }: TaskCardProps) => (
  <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500 hover:shadow-md transition-all">
    <h3 className="font-semibold text-gray-800 mb-2">{task.title}</h3>
    {task.description && (
      <p className="text-sm text-gray-500 mb-4 leading-relaxed">{task.description}</p>
    )}
    <button
      onClick={() => onSelect(task)}
      className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-all"
    >
      Assign to me
    </button>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const SoldierTasks = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, isLoading } = useSelector((s: RootState) => s.tasks);
  const { isLoading: assigning, error: assignError } = useSelector(
    (s: RootState) => s.assignments
  );

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [form, setForm] = useState<SelfAssignFormData>(initialForm);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  const fetchTasks = async () => {
    dispatch(setTaskLoading(true));
    try {
      const res = await api.get<{ success: boolean; data: Task[] }>(
        `${API_ROUTES.SOLDIER}/tasks`
      );
      dispatch(setTasks(res.data.data));
    } catch (err: unknown) {
      dispatch(setTaskError(extractError(err)));
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSelect = (task: Task) => {
    setSelectedTask(task);
    setForm(initialForm);
    setFormError("");
    setSuccessMsg("");
  };

  const handleClose = () => {
    setSelectedTask(null);
    setForm(initialForm);
    setFormError("");
  };

  const handleFieldChange = (field: keyof SelfAssignFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTask) return;

    const start = new Date(form.startTime);
    const end = new Date(form.endTime);

    if (end <= start) {
      setFormError("End time must be after start time");
      return;
    }

    dispatch(setAssignmentLoading(true));
    try {
      const res = await api.post<SelfAssignResponse>(
        `${API_ROUTES.SOLDIER}/assignments`,
        {
          taskId: selectedTask._id,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        }
      );
      dispatch(addAssignment(res.data.data));
      setSuccessMsg(`Successfully assigned to "${selectedTask.title}"`);
      handleClose();
    } catch (err: unknown) {
      dispatch(setAssignmentError(extractError(err)));
    }
  };

  return (
    <div className="space-y-6">

      {/* header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Available Tasks</h1>
        <p className="text-gray-500 text-sm mt-1">
          Select a task from the manager's approved list to assign yourself
        </p>
      </div>

      {/* success */}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <span className="text-green-600 text-xl">✅</span>
          <p className="text-green-800 text-sm font-medium">{successMsg}</p>
          <button
            onClick={() => setSuccessMsg("")}
            className="ml-auto text-green-500 hover:text-green-700 text-lg font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* loading */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <div className="text-3xl mb-2">📋</div>
          <p>Loading available tasks...</p>
        </div>
      ) : !tasks.length ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-xl shadow text-gray-400">
          <div className="text-3xl mb-2">📋</div>
          <p className="text-sm">No tasks available right now</p>
          <p className="text-xs mt-1">Check back later or contact your manager</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onSelect={handleSelect} />
          ))}
        </div>
      )}

      {/* assign modal */}
      {selectedTask && (
        <Modal title={`Assign: ${selectedTask.title}`} onClose={handleClose}>
          <form onSubmit={handleSubmit} className="space-y-4">

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{formError}</p>
              </div>
            )}

            {assignError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{assignError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                type="datetime-local"
                required
                value={form.startTime}
                onChange={(e) => handleFieldChange("startTime", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <input
                type="datetime-local"
                required
                value={form.endTime}
                onChange={(e) => handleFieldChange("endTime", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <p className="text-xs text-gray-400">
              Make sure your time window doesn't overlap with any existing assignment
            </p>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assigning}
                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
              >
                {assigning ? "Assigning..." : "Confirm"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SoldierTasks;
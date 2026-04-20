import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import api from "../../api/axios";
import { ShieldAlert, ArrowLeft, Save, X } from "lucide-react";

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
}

interface Soldier {
  _id: string;
  name: string;
  armyNumber: string;
  rank?: string;
  status: string;
  manager?: {
    _id: string;
    name: string;
  };
}

const AssignTask = () => {
  const { user } = useSelector((s: RootState) => s.auth);
  const navigate = useNavigate();
  const { id: soldierId } = useParams<{ id: string }>();

  const [soldier, setSoldier] = useState<Soldier | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const isAdmin = user?.role === 'admin';

  const getErrorMessage = (err: any, fallback = "Unable to connect to server. Please try again later.") => {
    return err?.response?.data?.message || err?.message || fallback;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const soldierRoute = isAdmin ? `/api/admin/users/${soldierId}` : `/api/manager/soldiers/${soldierId}`;
        const soldierRes = await api.get(soldierRoute);

        if (!soldierRes.data.success) {
          throw new Error(soldierRes.data.message || "Failed to load soldier details");
        }

        let soldierData;
        if (isAdmin) {
          soldierData = soldierRes.data.data;
        } else {
          soldierData = soldierRes.data.data.soldier;
        }
        
        setSoldier(soldierData);

        const tasksRoute = isAdmin
          ? soldierData.manager
            ? `/api/admin/tasks?managerId=${soldierData.manager._id}`
            : "/api/admin/tasks?managerId="
          : "/api/manager/tasks";

        const tasksRes = await api.get(tasksRoute);
        if (!tasksRes.data.success) {
          throw new Error(tasksRes.data.message || "Failed to load tasks");
        }
        setTasks(tasksRes.data.data);

        // Calculate current date/time mapped correctly to local timezone for the datetime-local input
        const now = new Date();
        const start = new Date(now.getTime() - now.getTimezoneOffset() * 60000); // adjust to local for input display
        const end = new Date(start.getTime() + 1 * 60 * 60 * 1000); 

        setStartTime(start.toISOString().slice(0, 16));
        setEndTime(end.toISOString().slice(0, 16));
      } catch (err: any) {
        setError(getErrorMessage(err, "Failed to load soldier or task data."));
      } finally {
        setLoading(false);
      }
    };

    if (soldierId) {
      fetchData();
    }
  }, [soldierId, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTask || !startTime || !endTime) {
      setStatusMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage(null);
      setError(null);

      const assignmentData = {
        soldierId,
        taskId: selectedTask,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      };

      const endpoint = isAdmin ? "/api/admin/assignments" : "/api/manager/assignments";
      const res = await api.post(endpoint, assignmentData);

      if (res.data.success) {
        setStatusMessage({ type: 'success', text: 'Task assigned successfully. Redirecting...' });
        setShouldRedirect(true);
      } else {
        setStatusMessage({ type: 'error', text: res.data.message || 'Failed to assign task.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: getErrorMessage(err, 'Unable to assign task right now. Please try again later.') });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!shouldRedirect) return;

    const timeout = setTimeout(() => {
      navigate(isAdmin ? "/admin/dashboard" : "/manager/dashboard");
    }, 1500);

    return () => clearTimeout(timeout);
  }, [shouldRedirect, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <ShieldAlert className="w-16 h-16 text-green-500 animate-pulse" />
          <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-ping"></div>
        </div>
        <p className="mt-6 text-green-400/80 font-mono tracking-[0.2em] uppercase text-sm animate-pulse">
          Loading Assignment Data...
        </p>
      </div>
    );
  }

  if (error || !soldier) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-950/40 border border-red-900/50 rounded-2xl p-8 max-w-lg text-center backdrop-blur-sm">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white tracking-wide mb-2">Error</h2>
          <p className="text-red-400/80 text-sm">{error || "Soldier not found"}</p>
          <button
            onClick={() => navigate(isAdmin ? "/admin/dashboard" : "/manager/dashboard")}
            className="mt-6 px-6 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-100 rounded-lg transition-all border border-red-800 tracking-wide text-sm font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800/60 pb-6 relative">
        <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-gradient-to-r from-green-500 to-transparent"></div>
        <div>
          <button
            onClick={() => navigate(isAdmin ? "/admin/dashboard" : "/manager/dashboard")}
            className="flex items-center gap-1.5 text-gray-400 hover:text-green-400 text-xs tracking-widest font-mono mb-4 transition-colors w-fit"
          >
            <ArrowLeft size={14} /> BACK TO DASHBOARD
          </button>
          <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">
            Assign Task
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Assign a task to {soldier?.name}
          </p>
        </div>
      </div>

      {/* Assignment Form */}
      <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-8 backdrop-blur-md max-w-2xl">
        {/* Soldier Info */}
        <div className="mb-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
          <h3 className="text-lg font-bold text-white tracking-wide mb-3">Soldier Details</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-900/40 text-blue-400 border border-blue-800/50 flex items-center justify-center font-bold text-lg">
              {soldier?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-bold text-lg tracking-wide">{soldier?.name}</p>
              <p className="text-gray-400 text-sm">#{soldier?.armyNumber} • {soldier?.rank || "Unranked"}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-300 tracking-widest uppercase mb-2">
              Select Task
            </label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              required
            >
              <option value="">Choose a task...</option>
              {tasks.map((task) => (
                <option key={task._id} value={task._id}>
                  {task.title} ({task.priority} priority)
                </option>
              ))}
            </select>
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-bold text-gray-300 tracking-widest uppercase mb-2">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-bold text-gray-300 tracking-widest uppercase mb-2">
              End Time
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          {/* Status / Error Message */}
          {statusMessage && (
            <div className={`rounded-xl p-4 ${statusMessage.type === 'success' ? 'bg-emerald-950/40 border border-emerald-900/50' : 'bg-red-950/40 border border-red-900/50'}`}>
              <p className={`${statusMessage.type === 'success' ? 'text-emerald-300' : 'text-red-400'} text-sm`}>{statusMessage.text}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Assign Task
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(isAdmin ? "/admin/dashboard" : "/manager/dashboard")}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all flex items-center gap-2"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignTask;
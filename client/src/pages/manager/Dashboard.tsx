import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "../../api/axios";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { ShieldAlert, Users, FolderClock, Activity, ArrowLeft, Eye, Plus, Dumbbell, Footprints } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Modal from "../../components/ui/Modal";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PieSlice {
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
}

interface DashboardData {
  total: number;
  free: number;
  busy: number;
  onLeave?: number;
}

interface Soldier {
  _id: string;
  name: string;
  armyNumber: string;
  rank?: string;
  isBusy: boolean;
  isOnLeave: boolean;
  currentTask: { title: string; type?: string } | null;
  status: string;
}

interface Task {
  _id: string;
  title: string;
  type?: string;
  description?: string;
  status: string;
}

interface Assignment {
  _id: string;
  soldier: { _id: string; name: string; rank?: string; armyNumber: string };
  task: { _id: string; title: string; description?: string };
  startTime: string;
  endTime: string;
  status: "upcoming" | "active" | "pending_review" | "completed" | "rejected";
  createdBy: "manager" | "soldier";
  assignedBy?: { name: string; rank?: string };
  notes?: string;
  priority?: "low" | "medium" | "high";
  location?: string;
  createdAt: string;
}

interface Leave {
  _id: string;
  status: string;
}


interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; name: string }[];
}

// ─── Custom Tooltip ───────────────────────────────────────────
const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const name = payload[0].name;
    return (
      <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl px-4 py-3 transition-all duration-200 scale-100">
        <p className="text-sm font-bold text-white tracking-wide">{name}</p>
        <p className="text-xs text-gray-300 font-mono mt-1">
          {value} personnel
        </p>
      </div>
    );
  }
  return null;
};

// ─── Helper: Get icon for task type ───────────────────────────────────
const getTaskIcon = (taskTitle: string, taskType?: string) => {
  const title = taskTitle.toLowerCase();
  const type = taskType?.toLowerCase() || '';

  if (type.includes('run') || title.includes('run') || title.includes('jog')) {
    return <Footprints size={18} />;
  } else if (type.includes('gym') || title.includes('gym') || title.includes('weight')) {
    return <Dumbbell size={18} />;
  } else if (type.includes('exercise') || title.includes('exercise') || title.includes('pt') || title.includes('training')) {
    return <Activity size={18} />;
  } else if (title.includes('guard') || title.includes('security') || title.includes('patrol')) {
    return <ShieldAlert size={18} />;
  } else if (title.includes('clean') || title.includes('maintenance')) {
    return <FolderClock size={18} />;
  } else {
    return <Activity size={18} />; // default icon
  }
};

// ─── Helper: Get color for task ───────────────────────────────────
const getTaskColor = (index: number): 'emerald' | 'blue' | 'purple' => {
  const colors = ['emerald', 'blue', 'purple'] as const;
  return colors[index % colors.length];
};

// ─── Helper: Dynamic task counts based on actual tasks ───────────────────────────────────
const useDynamicTaskCounts = (soldiers: Soldier[], tasks: Task[]) => {
  const taskCounts: { [taskId: string]: { count: number; task: Task } } = {};

  // Initialize counts for all tasks
  tasks.forEach(task => {
    taskCounts[task._id] = { count: 0, task };
  });

  // Count soldiers assigned to each task
  soldiers.forEach(soldier => {
    if (soldier.isBusy && soldier.currentTask) {
      // Find the task by title or ID
      const matchingTask = tasks.find(task =>
        task.title === soldier.currentTask?.title ||
        task._id === soldier.currentTask?.title // fallback if title is ID
      );

      if (matchingTask) {
        taskCounts[matchingTask._id].count++;
      }
    }
  });

  return taskCounts;
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ManagerDashboard = () => {
  const { user } = useSelector((s: RootState) => s.auth);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [soldiers, setSoldiers] = useState<Soldier[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'free' | 'busy' | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskAssignments, setTaskAssignments] = useState<Assignment[]>([]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const dashRoute = id ? `/api/admin/managers/${id}/dashboard` : `/api/manager/dashboard`;
      const soldRoute = id ? `/api/admin/managers/${id}/soldiers` : `/api/manager/soldiers`;
      const leaveRoute = id ? `/api/admin/managers/${id}/leaves` : `/api/manager/leaves`;
      const taskRoute = id ? `/api/admin/managers/${id}/tasks` : `/api/manager/tasks`;

      const [dashRes, soldRes, leaveRes, taskRes] = await Promise.allSettled([
        api.get(dashRoute),
        api.get(soldRoute),
        api.get(leaveRoute),
        api.get(taskRoute),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value.data.success) {
        setDashboard(dashRes.value.data.data);
      }
      if (soldRes.status === "fulfilled" && soldRes.value.data.success) {
        setSoldiers(soldRes.value.data.data);
      }
      if (leaveRes.status === "fulfilled" && leaveRes.value.data.success) {
        setLeaves(leaveRes.value.data.data);
      }
      if (taskRes.status === "fulfilled" && taskRes.value.data.success) {
        setTasks(taskRes.value.data.data);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong fetching data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <ShieldAlert className="w-16 h-16 text-green-500 animate-pulse" />
          <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-ping"></div>
        </div>
        <p className="mt-6 text-green-400/80 font-mono tracking-[0.2em] uppercase text-sm animate-pulse">
          Loading Data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-950/40 border border-red-900/50 rounded-2xl p-8 max-w-lg text-center backdrop-blur-sm">
          <Activity className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white tracking-wide mb-2">Connection Lost</h2>
          <p className="text-red-400/80 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-100 rounded-lg transition-all border border-red-800 tracking-wide text-sm font-semibold">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // ─── Computed Data ─────────────────────────────────────────────────────────
  const onLeaveCount = soldiers.filter(s => s.isOnLeave).length;
  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;
  const total = dashboard?.total || 0;
  const free = dashboard?.free || 0;
  const busy = dashboard?.busy || 0;

  const fetchTaskAssignments = async (taskId: string) => {
    try {
      const response = await api.get(`/api/manager/assignments?task=${taskId}`);
      if (response.data.success) {
        setTaskAssignments(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch task assignments:', err);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    fetchTaskAssignments(task._id);
  };

  const pieData: PieSlice[] = [
    {
      label: "Free Units",
      value: free,
      color: "#10b981",
      onClick: () => setSelectedCategory('free')
    },
    {
      label: "Deployed / On Duty",
      value: busy,
      color: "#3b82f6",
      onClick: () => setSelectedCategory('busy')
    },
    {
      label: "On Leave",
      value: onLeaveCount,
      color: "#f59e0b",
      onClick: () => navigate("/manager/leaves")
    },
  ].filter((d) => d.value > 0);

  const hasAnyData = total > 0;

  const getFilteredSoldiers = () => {
    if (!selectedCategory) return soldiers;
    return soldiers.filter(soldier => {
      switch (selectedCategory) {
        case 'free':
          return !soldier.isBusy && !soldier.isOnLeave;
        case 'busy':
          return soldier.isBusy;
        default:
          return true;
      }
    });
  };

  const filteredSoldiers = getFilteredSoldiers();
  const taskCounts = useDynamicTaskCounts(soldiers, tasks);
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800/60 pb-6 relative">
        <div className="absolute top-2 left-0 w-32 h-[1px] bg-gradient-to-r from-green-500 to-transparent"></div>
        <div>
          {id ? (
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="flex items-center gap-1.5 text-gray-400 hover:text-green-400 text-xs tracking-widest font-mono mb-4 transition-colors w-fit"
            >
              <ArrowLeft size={14} /> BACK TO COMMAND CENTER
            </button>
          ) : (
            <div />
          )}
        </div>
        <div className="flex items-center gap-3">
          {!id && !isAdmin && (
            <button
              onClick={() => navigate("/manager/RegisterSoldier")}
              className="group relative overflow-hidden bg-blue-600 text-white hover:bg-blue-500 border border-blue-500 font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> Register Soldier
            </button>
          )}
          <button
            onClick={fetchDashboard}
            className="group relative overflow-hidden bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-700 font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-sm"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Pie Chart */}
        <div className="bg-gray-900/40 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden flex flex-col">
          <h3 className="text-lg font-bold text-white tracking-wide mb-2">Live Deployment Status</h3>
          <p className="text-xs text-gray-400 font-mono mb-6">Unit breakdown by current directive</p>
          <p className="text-gray-400 text-xs text-center mb-4">Click on a section to view soldiers</p>

          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
            {!hasAnyData ? (
              <div className="text-center text-gray-500">
                <Users size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold tracking-wider">NO UNITS ASSIGNED</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={105}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="label"
                    stroke="none"
                    isAnimationActive={true}
                    onClick={(data) => data?.onClick?.()}
                    style={{ cursor: 'pointer' }}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: 'pointer' }} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    onClick={(entry) => {
                      const slice = pieData.find(d => d.label === entry.value);
                      slice?.onClick?.();
                    }}
                    formatter={(value: string) => (
                      <span className="text-sm text-gray-300 font-medium ml-2 tracking-wide cursor-pointer">{value}</span>
                    )}
                    wrapperStyle={{ paddingTop: "20px", cursor: 'pointer' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Column: Big Panel with Tasks & Metrics */}
        <div className="bg-gray-900/40 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden flex flex-col">
          <h3 className="text-lg font-bold text-white tracking-wide mb-2">Deployment Status</h3>
          <p className="text-xs text-gray-400 font-mono mb-6">{total} soldiers total</p>

          {/* On Duty section with task type boxes */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
                ON DUTY — {busy} SOLDIERS
              </p>
              <button
                onClick={() => setSelectedCategory('busy')}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                View soldiers →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(taskCounts)
                .filter(([_, { count }]) => count > 0)
                .map(([taskId, { count, task }], index) => (
                  <TaskTypeBox
                    key={taskId}
                    label={task.title.toUpperCase()}
                    count={count}
                    icon={getTaskIcon(task.title, task.type)}
                    color={getTaskColor(index)}
                    onClick={() => handleTaskClick(task)}
                  />
                ))}
              {Object.keys(taskCounts).filter(taskId => taskCounts[taskId].count > 0).length === 0 && (
                <div className="col-span-full text-center py-8">
                  <Activity size={32} className="text-gray-600 mx-auto mb-2 opacity-50" />
                  <p className="text-gray-500 text-sm">No active tasks</p>
                </div>
              )}
            </div>
          </div>

          {/* Four metric cards */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label="TOTAL"
              value={total}
              color="gray"
              onClick={() => navigate("/manager/soldiers")}
            />
            <MetricCard
              label="FREE"
              value={free}
              color="green"
              onClick={() => setSelectedCategory('free')}
            />
            <MetricCard
              label="ON DUTY"
              value={busy}
              color="blue"
              onClick={() => setSelectedCategory('busy')}
            />
            <MetricCard
              label="ON LEAVE"
              value={onLeaveCount}
              color="amber"
              onClick={() => navigate("/manager/leaves")}
              badge={pendingLeaves > 0 ? pendingLeaves : undefined}
            />
          </div>
        </div>
      </div>

      {/* Filtered Soldiers Modal */}
      {selectedCategory && (
        <Modal
          title={`${
            selectedCategory === 'free' ? 'Free Units' : 'Deployed / On Duty'
          } - ${filteredSoldiers.length} Soldiers`}
          onClose={() => setSelectedCategory(null)}
          size="xl"
        >
          {filteredSoldiers.length === 0 ? (
            <div className="p-8 text-center">
              <Users size={48} className="text-gray-800 mx-auto mb-4 opacity-30" />
              <p className="text-gray-500 font-medium tracking-wide font-mono uppercase text-xs">
                No soldiers in this category
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-950/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold text-gray-400 text-xs tracking-widest uppercase">#</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-400 text-xs tracking-widest uppercase">Soldier</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-400 text-xs tracking-widest uppercase">Army ID</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-400 text-xs tracking-widest uppercase">Rank</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-400 text-xs tracking-widest uppercase">Status</th>
                    {selectedCategory === 'busy' && (
                      <th className="text-left px-4 py-3 font-bold text-gray-400 text-xs tracking-widest uppercase">Current Task</th>
                    )}
                    {(selectedCategory === 'free' || isAdmin) && (
                      <th className="text-left px-4 py-3 font-bold text-gray-400 text-xs tracking-widest uppercase">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {filteredSoldiers.map((soldier, index) => {
                    let statusLabel = "Free";
                    let statusColor = "text-green-400";
                    let bgColor = "bg-green-900/40";

                    if (soldier.isOnLeave) {
                      statusLabel = "On Leave";
                      statusColor = "text-yellow-400";
                      bgColor = "bg-yellow-900/40";
                    } else if (soldier.isBusy) {
                      statusLabel = "On Duty";
                      statusColor = "text-blue-400";
                      bgColor = "bg-blue-900/40";
                    }

                    return (
                      <tr key={soldier._id} className="hover:bg-gray-800/30 transition-colors group">
                        <td className="px-4 py-3 text-gray-400 font-semibold text-xs">{index + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${bgColor} border border-gray-700`}>
                              {soldier.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm tracking-wide">{soldier.name}</p>
                              <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-0.5">#{soldier.armyNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs tracking-wider">#{soldier.armyNumber}</td>
                        <td className="px-4 py-3">
                          <span className="text-gray-400 font-semibold bg-gray-950 px-2 py-1 rounded border border-gray-800 text-xs">
                            {soldier.rank ?? "Unranked"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 font-bold text-[10px] tracking-widest uppercase px-2 py-0.5 rounded border ${statusColor} ${bgColor.replace('bg-', 'border-').replace('/40', '/50')}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusColor.replace('text-', 'bg-')}`}></span>
                            {statusLabel}
                          </span>
                        </td>
                        {selectedCategory === 'busy' && (
                          <td className="px-4 py-3">
                            {soldier.currentTask ? (
                              <span className="text-gray-400 text-xs max-w-[150px] truncate" title={soldier.currentTask.title}>
                                {soldier.currentTask.title}
                              </span>
                            ) : (
                              <span className="text-gray-600 text-xs italic">No task assigned</span>
                            )}
                          </td>
                        )}
                        {(selectedCategory === 'free' || isAdmin) && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isAdmin && (
                                <button
                                  onClick={() => {
                                    setSelectedCategory(null);
                                    navigate(`/admin/soldier/${soldier._id}`);
                                  }}
                                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800/50 rounded"
                                  title="View Soldier Details"
                                >
                                  <Eye size={14} />
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setSelectedCategory(null);
                                  navigate(isAdmin ? `/admin/assign-task/${soldier._id}` : `/manager/assign-task/${soldier._id}`);
                                }}
                                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors px-3 py-2 hover:bg-blue-900/20 rounded-lg border border-blue-900/30"
                                title="Assign Task"
                              >
                                <Plus size={14} />
                                <span className="text-xs uppercase tracking-[0.2em] font-bold">Assign</span>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}

      {/* Task-Specific Soldiers Modal */}
      {selectedTask && (
        <Modal
          title={`${selectedTask.title} - ${taskAssignments.filter(a => a.status === 'active').length} Active Personnel`}
          onClose={() => {
            setSelectedTask(null);
            setTaskAssignments([]);
          }}
          size="xl"
        >
          {taskAssignments.filter(a => a.status === 'active').length === 0 ? (
            <div className="p-8 text-center">
              <Users size={48} className="text-gray-800 mx-auto mb-4 opacity-30" />
              <p className="text-gray-500 font-medium tracking-wide font-mono uppercase text-xs">
                No personnel currently active on this task
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-950/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold text-gray-400 text-xs tracking-widest uppercase">#</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-400 text-xs tracking-widest uppercase">Personnel</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-400 text-xs tracking-widest uppercase">Army ID</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-400 text-xs tracking-widest uppercase">Rank</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-400 text-xs tracking-widest uppercase">Start Time</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-400 text-xs tracking-widest uppercase">End Time</th>
                    {isAdmin && (
                      <th className="text-left px-4 py-3 font-bold text-gray-400 text-xs tracking-widest uppercase">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {taskAssignments
                    .filter(a => a.status === 'active')
                    .map((assignment, index) => {
                    return (
                      <tr key={assignment._id} className="hover:bg-gray-900/20 transition-colors">
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{index + 1}</td>
                        <td className="px-4 py-3 text-white font-semibold">{assignment.soldier.name}</td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs tracking-wider">#{assignment.soldier.armyNumber}</td>
                        <td className="px-4 py-3">
                          <span className="text-gray-400 font-semibold bg-gray-950 px-2 py-1 rounded border border-gray-800 text-xs">
                            {assignment.soldier.rank ?? "Unranked"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300 font-mono text-xs">
                          {new Date(assignment.startTime).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-gray-300 font-mono text-xs">
                          {new Date(assignment.endTime).toLocaleString()}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setSelectedTask(null);
                                setTaskAssignments([]);
                                navigate(`/admin/soldier/${assignment.soldier._id}`);
                              }}
                              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800/50 rounded"
                              title="View Soldier Details"
                            >
                              <Eye size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

// ─── Helper Components ───────────────────────────────────────────────────────

const MetricCard = ({ label, value, color, onClick, badge }: {
  label: string;
  value: number;
  color: 'gray' | 'green' | 'blue' | 'amber';
  onClick?: () => void;
  badge?: number;
}) => {
  const bgClasses = {
    gray: "bg-gray-800/40 border-gray-700 text-gray-200 hover:bg-gray-800/60",
    green: "bg-green-900/30 border-green-800/50 text-green-300 hover:bg-green-900/50",
    blue: "bg-blue-900/30 border-blue-800/50 text-blue-300 hover:bg-blue-900/50",
    amber: "bg-amber-900/30 border-amber-800/50 text-amber-300 hover:bg-amber-900/50",
  };

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl border p-4 transition-all cursor-pointer backdrop-blur-sm ${bgClasses[color]}`}
    >
      <p className="text-xs font-semibold tracking-widest uppercase opacity-80">{label}</p>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-3xl font-black tracking-tighter">{value}</span>
        {badge && (
          <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};

const TaskTypeBox = ({ label, count, icon, color, onClick }: {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'purple';
  onClick?: () => void;
}) => {
  const bgClasses = {
    emerald: "bg-emerald-900/30 border-emerald-800/50 text-emerald-300 hover:bg-emerald-900/50",
    blue: "bg-blue-900/30 border-blue-800/50 text-blue-300 hover:bg-blue-900/50",
    purple: "bg-purple-900/30 border-purple-800/50 text-purple-300 hover:bg-purple-900/50",
  };

  return (
    <div
      className={`rounded-xl border p-4 ${bgClasses[color]} backdrop-blur-sm cursor-pointer transition-all duration-200 hover:scale-105`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="opacity-80">{icon}</span>
        <span className="text-xs font-semibold tracking-widest uppercase leading-tight line-clamp-2">{label}</span>
      </div>
      <p className="text-2xl font-bold">{count} <span className="text-xs font-normal tracking-wide ml-1">Soldiers</span></p>
    </div>
  );
};

export default ManagerDashboard;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { 
  ShieldAlert, Activity, Users, UserCheck, 
  ChevronRight, AlertCircle, Clock, Target, Shield, Briefcase, Trash2
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import Modal from "../../components/ui/Modal";

// ─── Types ───────────────────────────────────────────────────────────

interface DashboardData {
  totalManagers: number;
  totalSoldiers: number;
  free: number;
  busy: number;
  onLeave: number;
  taskBreakdown: Array<{
    count: number;
    title: string;
    type?: string;
    _id: string;
  }>;
}

interface Manager {
  _id: string;
  name: string;
  armyNumber: string;
  rank?: string;
  unit?: string;
  status: string;
}

interface Soldier {
  _id: string;
  name: string;
  armyNumber: string;
  rank?: string;
  unit?: string;
  status: string;
  isOnLeave?: boolean;
  isBusy?: boolean;
  currentTask?: { title: string } | null;
  manager?: { name: string; rank: string };
}

const AdminDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [soldiers, setSoldiers] = useState<Soldier[]>([]);
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersonnel, setSelectedPersonnel] = useState<'managers' | 'soldiers' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'free' | 'busy' | 'on_leave' | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, managersRes, leavesRes, soldiersRes] = await Promise.all([
        api.get("/api/admin/dashboard"),
        api.get("/api/admin/managers"),
        api.get("/api/admin/leaves"),
        api.get("/api/admin/soldiers")
      ]);

      if (dashRes.data.success) setData(dashRes.data.data);
      if (managersRes.data.success) setManagers(managersRes.data.data);
      if (leavesRes.data.success) setPendingLeavesCount(leavesRes.data.count);
      if (soldiersRes.data.success) setSoldiers(soldiersRes.data.data);

    } catch (err: any) {
      setError(err.message || "Failed to establish connection to command data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteManager = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to decommission Manager ${name}? This action cannot be undone.`)) return;
    
    try {
      setIsDeleting(id);
      await api.delete(`/api/admin/users/${id}`);
      setManagers(prev => prev.filter(m => m._id !== id));
      // Refresh dashboard data as counts will change
      const dashRes = await api.get("/api/admin/dashboard");
      if (dashRes.data.success) setData(dashRes.data.data);
    } catch (err: any) {
      alert("Failed to delete manager: " + (err.response?.data?.message || err.message));
    } finally {
      setIsDeleting(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <ShieldAlert className="w-16 h-16 text-green-500 animate-pulse" />
          <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-ping"></div>
        </div>
        <p className="mt-6 text-green-400/80 font-mono tracking-[0.2em] uppercase text-sm animate-pulse">Syncing Command Nexus...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-950/40 border border-red-900/50 rounded-2xl p-8 max-w-lg text-center backdrop-blur-sm">
          <Activity className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white tracking-wide mb-2">Connection Lost</h2>
          <p className="text-red-400/80 text-sm">{error || "Data unavailable"}</p>
          <button onClick={() => fetchData()} className="mt-6 px-6 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-100 rounded-lg transition-all border border-red-800 tracking-wide text-sm font-semibold">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: "Free", value: data.free, color: "#10b981", category: 'free' },
    { name: "Busy", value: data.busy, color: "#3b82f6", category: 'busy' },
    { name: "On Leave", value: data.onLeave, color: "#f59e0b", category: 'on_leave' },
  ].filter(d => d.value > 0);

  // Filter soldiers based on category or task
  const getFilteredSoldiers = () => {
    if (selectedCategory) {
      if (selectedCategory === 'free') return soldiers.filter(s => !s.isBusy && !s.isOnLeave);
      if (selectedCategory === 'busy') return soldiers.filter(s => s.isBusy && !s.isOnLeave);
      if (selectedCategory === 'on_leave') return soldiers.filter(s => s.isOnLeave);
    }
    if (selectedTask) {
      return soldiers.filter(s => s.currentTask?.title === selectedTask);
    }
    return [];
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800/60 pb-6 relative">
        <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-gradient-to-r from-green-500 to-transparent"></div>
        <div>
           <div className="flex items-center gap-2 mb-2">
             <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></span>
             <p className="text-green-500 text-xs tracking-[0.3em] uppercase font-mono">Supreme Command Center</p>
           </div>
           <p className="text-gray-400 text-sm mt-1">Aggregated live deployment data from all units</p>
        </div>
        <button
           onClick={() => navigate("/admin/register-manager")}
           className="group relative overflow-hidden bg-white text-gray-950 hover:bg-gray-100 font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center gap-2 text-sm"
        >
           <Shield size={16} /> Deploy New Manager
        </button>
      </div>

      {/* Main Aggregates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          label="Total Soldiers" 
          value={data.totalSoldiers} 
          color="gray" 
        />
        <MetricCard 
          label="Active Managers" 
          value={data.totalManagers} 
          color="blue" 
          onClick={() => setSelectedPersonnel('managers')}
        />
        <MetricCard 
          label="On Duty (Global)" 
          value={data.busy} 
          color="green" 
          onClick={() => setSelectedCategory('busy')}
        />
        <MetricCard 
          label="On Leave (Global)" 
          value={data.onLeave} 
          color="amber" 
          onClick={() => setSelectedCategory('on_leave')}
          badge={pendingLeavesCount > 0 ? pendingLeavesCount : undefined}
        />
      </div>

      {/* Charts & Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Live Pie Chart */}
        <div className="bg-gray-900/40 border border-gray-800/80 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[80px] rounded-full"></div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-white tracking-wide">Live Deployment Status</h3>
              <p className="text-gray-500 text-xs mt-1 font-mono uppercase tracking-widest">Entire Army Distribution</p>
            </div>
            <Activity className="text-green-500/50" size={24} />
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  onClick={(entry) => setSelectedCategory(entry.category as any)}
                  className="cursor-pointer"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      className="drop-shadow-[0_0_8px_rgba(0,0,0,0.5)] focus:outline-none hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            {pieData.map((item) => (
              <div 
                key={item.name} 
                onClick={() => setSelectedCategory(item.category as any)}
                className="bg-gray-950/50 border border-gray-800 shadow-inner rounded-2xl p-3 text-center cursor-pointer hover:bg-gray-800/50 transition-colors"
                >
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{item.name}</p>
                <p className="text-lg font-black text-white" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* System-wide Task Breakdown */}
        <div className="bg-gray-900/40 border border-gray-800/80 rounded-3xl p-8 backdrop-blur-md">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-white tracking-wide">Duty Distribution</h3>
              <p className="text-gray-500 text-xs mt-1 font-mono uppercase tracking-widest">Current Active Objectives</p>
            </div>
            <Target className="text-blue-500/50" size={24} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {data.taskBreakdown.length === 0 ? (
              <div className="col-span-2 py-12 text-center border-2 border-dashed border-gray-800 rounded-3xl">
                <Clock className="mx-auto text-gray-700 mb-2" size={32} />
                <p className="text-gray-500 text-sm font-medium">No active duties reported</p>
              </div>
            ) : (
              data.taskBreakdown.map((task) => (
                <TaskTypeBox
                  key={task._id}
                  label={task.title}
                  count={task.count}
                  icon={<Briefcase size={16} />}
                  color={task.count > 10 ? 'purple' : 'blue'}
                  onClick={() => setSelectedTask(task.title)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Managers Grid */}
      <div className="bg-gray-900/25 border border-gray-800/60 rounded-3xl p-6 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-white tracking-wide">Command Units (Managers)</h3>
          <button
            onClick={() => setSelectedPersonnel('managers')}
            className="text-sm text-blue-300 hover:text-blue-200 transition-colors font-semibold tracking-wide flex items-center gap-1"
          >
            View detail Roster <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {managers.map((manager) => (
            <div
              key={manager._id}
              onClick={() => navigate(`/admin/manager/${manager._id}`)}
              className="cursor-pointer bg-gray-900/60 border border-gray-800/80 rounded-2xl p-4 hover:border-blue-500/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-900/30 border border-blue-800/50 flex items-center justify-center font-bold text-blue-300 group-hover:scale-110 transition-transform">
                  {manager.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{manager.name}</p>
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-tighter">#{manager.armyNumber}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-800/50 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase">{manager.unit || 'No Unit'}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${manager.status === 'active' ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-gray-600'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Managers Roster Modal */}
      {selectedPersonnel === 'managers' && (
        <Modal title="Supreme Manager Roster" onClose={() => setSelectedPersonnel(null)} size="xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-950/50">
                <tr>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Manager</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Rank/ID</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Unit</th>
                  <th className="text-right px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {managers.map((manager) => (
                  <tr key={manager._id} className="hover:bg-gray-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-900/30 border border-blue-800/50 flex items-center justify-center font-bold text-blue-400">
                          {manager.name.charAt(0)}
                        </div>
                        <span className="font-bold text-white">{manager.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs uppercase">
                      {manager.rank || 'OFFICER'} · #{manager.armyNumber}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-950 px-2 py-1 rounded border border-gray-800 text-gray-500 text-xs font-bold uppercase">{manager.unit || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                      <button 
                        onClick={() => navigate(`/admin/manager/${manager._id}`)}
                        className="text-blue-400 hover:text-white transition-colors text-xs font-bold underline underline-offset-4"
                      >
                        Inspect
                      </button>
                      <button 
                        onClick={() => handleDeleteManager(manager._id, manager.name)}
                        disabled={isDeleting === manager._id}
                        className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Decommission Manager"
                      >
                        <Trash2 size={16} className={isDeleting === manager._id ? 'animate-pulse' : ''} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {/* Personnel List Modal (Category or Task) */}
      {(selectedCategory || selectedTask) && (
        <Modal 
          title={selectedCategory ? `${selectedCategory.replace('_', ' ').toUpperCase()} PERSONNEL` : `DUTY ROSTER: ${selectedTask}`}
          onClose={() => { setSelectedCategory(null); setSelectedTask(null); }}
          size="xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-950/50">
                <tr>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Soldier</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Manager / Unit</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Current Status</th>
                  <th className="text-right px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {getFilteredSoldiers().map((s) => (
                  <tr key={s._id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center font-bold ${
                          s.isOnLeave ? 'bg-amber-900/30 border-amber-800/50 text-amber-400' :
                          s.isBusy ? 'bg-blue-900/30 border-blue-800/50 text-blue-400' :
                          'bg-emerald-900/30 border-emerald-800/50 text-emerald-400'
                        }`}>
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white">{s.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono tracking-tighter">#{s.armyNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300 font-semibold">{s.manager?.name || 'GEN HQ'}</p>
                      <p className="text-[10px] text-gray-500 uppercase">{s.unit || 'Global Command'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {s.isOnLeave ? (
                        <span className="text-amber-500 text-[10px] font-black tracking-widest border border-amber-900/50 px-2 py-0.5 rounded bg-amber-950/30 uppercase">ON LEAVE</span>
                      ) : s.isBusy ? (
                        <div className="flex flex-col">
                          <span className="text-blue-400 text-[10px] font-black tracking-widest border border-blue-900/50 px-2 py-0.5 rounded bg-blue-950/30 uppercase w-fit">BUSY</span>
                          <span className="text-[10px] text-gray-500 mt-1 italic">{s.currentTask?.title}</span>
                        </div>
                      ) : (
                        <span className="text-emerald-500 text-[10px] font-black tracking-widest border border-emerald-900/50 px-2 py-0.5 rounded bg-emerald-950/30 uppercase">AVAILABLE</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                        onClick={() => navigate(`/admin/soldier/${s._id}`)}
                        className="text-gray-400 hover:text-white transition-colors text-xs font-bold"
                       >
                         View Profile
                       </button>
                    </td>
                  </tr>
                ))}
                {getFilteredSoldiers().length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-mono italic">
                      No units matching the criteria reported.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

    </div>
  );
};

// ─── Helper Components ─────────────────────────────────────────────

const MetricCard = ({ label, value, color, onClick, badge }: {
  label: string;
  value: number;
  color: 'gray' | 'green' | 'blue' | 'amber';
  onClick?: () => void;
  badge?: number;
}) => {
  const bgClasses = {
    gray: "bg-gray-800/40 border-gray-700 text-gray-200",
    green: "bg-green-900/30 border-green-800/50 text-green-300 hover:border-green-500",
    blue: "bg-blue-900/30 border-blue-800/50 text-blue-300 hover:border-blue-500",
    amber: "bg-amber-900/30 border-amber-800/50 text-amber-300 hover:border-amber-500",
  };

  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl border p-5 transition-all backdrop-blur-md ${bgClasses[color]} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-70 mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <span className="text-4xl font-black tracking-tighter">{value}</span>
        {badge && (
          <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.4)] animate-pulse">
            {badge} PENDING
          </span>
        )}
      </div>
      <div className={`absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-current to-transparent opacity-20`}></div>
    </div>
  );
};

const TaskTypeBox = ({ label, count, icon, color, onClick }: {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: 'blue' | 'purple';
  onClick?: () => void;
}) => {
  const bgClasses = {
    blue: "bg-blue-900/20 border-blue-800/40 text-blue-300 hover:bg-blue-900/30 hover:border-blue-500/50",
    purple: "bg-purple-900/20 border-purple-800/40 text-purple-300 hover:bg-purple-900/30 hover:border-purple-500/50",
  };

  return (
    <div 
      onClick={onClick}
      className={`rounded-2xl border p-4 ${bgClasses[color]} backdrop-blur-sm transition-all duration-300 group cursor-pointer`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="p-1.5 bg-gray-950 rounded-lg group-hover:scale-110 transition-transform">
          {icon}
        </span>
        <span className="text-[10px] font-black tracking-widest uppercase leading-tight">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-black">{count}</p>
        <span className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">Units Assigned</span>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-950 border border-gray-800 p-3 rounded-xl shadow-2xl backdrop-blur-xl">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{payload[0].name}</p>
        <p className="text-xl font-black text-white">{payload[0].value} <span className="text-[10px] font-normal opacity-50">Soldiers</span></p>
      </div>
    );
  }
  return null;
};

export default AdminDashboard;
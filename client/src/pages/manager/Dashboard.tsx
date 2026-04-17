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
import { ShieldAlert, Users, FolderClock, Clock, Activity, ChevronRight, CheckSquare, ArrowLeft, Eye, Plus } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
  currentTask: { title: string } | null;
  status: string;
}

interface Leave {
  _id: string;
  status: string;
  startDate: string;
  endDate: string;
  soldier: string | { _id: string };
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

// ─── Main Component ───────────────────────────────────────────────────────────

const ManagerDashboard = () => {
  const { user } = useSelector((s: RootState) => s.auth);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [soldiers, setSoldiers] = useState<Soldier[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'free' | 'busy' | 'onleave' | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      
      const dashRoute = id ? `/api/admin/managers/${id}/dashboard` : `/api/manager/dashboard`;
      const soldRoute = id ? `/api/admin/managers/${id}/soldiers` : `/api/manager/soldiers`;
      const leaveRoute = id ? `/api/admin/managers/${id}/leaves` : `/api/manager/leaves`;

      const [dashRes, soldRes, leaveRes] = await Promise.allSettled([
        api.get(dashRoute),
        api.get(soldRoute),
        api.get(leaveRoute),
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

  // ─── Frontend Computed Data ───────────────────────────────────────────────────

  const now = new Date();
  const getLeaveSoldierId = (leave: Leave) => {
    if (typeof leave.soldier === "string") return leave.soldier;
    return leave.soldier?._id || "";
  };

  const onLeaveCount = dashboard?.onLeave || leaves.filter((l) => {
    const start = new Date(l.startDate);
    const end = new Date(l.endDate);
    const isActiveLeave = now >= start && now <= end;
    const isApproved = l.status === "approved" || l.status === "approved_by_manager";
    return isActiveLeave && isApproved;
  }).length;

  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;

  // Use backend free count directly since it now accounts for on leave soldiers
  const backendFree = dashboard?.free || 0;
  const busy = dashboard?.busy || 0;
  const total = dashboard?.total || 0;
  const actualFree = backendFree;

  const pieData: PieSlice[] = [
    { 
      label: "Free Units", 
      value: actualFree, 
      color: "#10b981",
      onClick: () => setSelectedCategory('free')
    }, // Green
    { 
      label: "Deployed / On Duty", 
      value: busy, 
      color: "#3b82f6",
      onClick: () => setSelectedCategory('busy')
    }, // Blue
    { 
      label: "On Leave", 
      value: onLeaveCount, 
      color: "#f59e0b",
      onClick: () => setSelectedCategory('onleave')
    }, // Amber
  ].filter((d) => d.value > 0);

  const hasAnyData = total > 0;

  // Filter soldiers based on selected category
  const getFilteredSoldiers = () => {
    if (!selectedCategory) return soldiers;

    return soldiers.filter(soldier => {
      switch (selectedCategory) {
        case 'free':
          return !soldier.isBusy && !soldier.isOnLeave;
        case 'busy':
          return soldier.isBusy;
        case 'onleave':
          return soldier.isOnLeave;
        default:
          return true;
      }
    });
  };

  const filteredSoldiers = getFilteredSoldiers();
  const isAdmin = user?.role === 'admin';
  const location = useLocation();

  return (
    <div key={location.key} className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800/60 pb-6 relative">
        <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-gradient-to-r from-green-500 to-transparent"></div>
        <div>
           {id ? (
             <button 
               onClick={() => navigate("/admin/dashboard")}
               className="flex items-center gap-1.5 text-gray-400 hover:text-green-400 text-xs tracking-widest font-mono mb-4 transition-colors w-fit"
             >
               <ArrowLeft size={14} /> BACK TO COMMAND CENTER
             </button>
           ) : (
             <div className="flex items-center gap-2 mb-2">
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></span>
               <p className="text-green-500 text-xs tracking-[0.3em] uppercase font-mono">Operations Center</p>
             </div>
           )}
           <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">
             {id ? "Target Manager View" : "Dashboard"}
           </h1>
           <p className="text-gray-400 text-sm mt-1">
             {id ? "Viewing delegated unit deployment" : `Welcome back, ${user?.name}`}
           </p>
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:bg-gray-900/60 transition-all flex flex-col justify-between">
             <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">
                 <Users size={14} className="text-white"/> Total Soldiers
             </div>
             <p className="text-4xl font-black text-white tracking-tighter">{total}</p>
          </div>

          <div className="bg-gray-900/40 border border-green-900/30 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:bg-green-950/20 transition-all flex flex-col justify-between">
             <div className="flex items-center gap-2 text-green-500/80 text-xs font-semibold uppercase tracking-widest mb-3">
                 <CheckSquare size={14} className="text-green-500"/> Free & Ready
             </div>
             <p className="text-4xl font-black text-green-400 tracking-tighter">{actualFree}</p>
          </div>

          <div className="bg-gray-900/40 border border-blue-900/30 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:bg-blue-950/20 transition-all flex flex-col justify-between">
             <div className="flex items-center gap-2 text-blue-500/80 text-xs font-semibold uppercase tracking-widest mb-3">
                 <ShieldAlert size={14} className="text-blue-500"/> On Duty
             </div>
             <p className="text-4xl font-black text-blue-400 tracking-tighter">{busy}</p>
          </div>

          <div className="bg-gray-900/40 border border-amber-900/30 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:bg-amber-950/20 transition-all">
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-amber-500/80 text-xs font-semibold uppercase tracking-widest mb-3">
                     <FolderClock size={14} className="text-amber-500"/> On Leave
                 </div>
                 {pendingLeaves > 0 && (
                     <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm animate-pulse flex items-center gap-1">
                         {pendingLeaves} PENDING
                     </span>
                 )}
             </div>
             <p className="text-4xl font-black text-amber-400 tracking-tighter">{onLeaveCount}</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Pie Chart Representation */}
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
                    <>
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
                    </>
                 )}
              </div>
          </div>

          {/* Soldiers Detailed List representing 'see all his soldiers' */}
          <div className="bg-gray-900/40 border border-gray-800/80 rounded-3xl overflow-hidden backdrop-blur-md flex flex-col max-h-[480px]">
             <div className="p-6 border-b border-gray-800/50 bg-gray-900/40 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white tracking-wide">Platoon Overview</h3>
                <span className="text-gray-500 text-xs font-mono">{soldiers.length} Soldiers</span>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                 {soldiers.length === 0 ? (
                    <div className="text-center text-gray-500 py-16">
                        <Users size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-bold tracking-wider">NO SOLDIERS REGISTERED</p>
                    </div>
                 ) : (
                    soldiers.map(s => {
                        let soldierStateLabel = "Free";
                        let stateColorClass = "bg-green-500";
                        let bannerBg = "bg-green-500/10 border-green-500/20";
                        
                        if (s.isOnLeave) {
                            soldierStateLabel = "On Leave";
                            stateColorClass = "bg-amber-500";
                            bannerBg = "bg-amber-500/10 border-amber-500/20";
                        } else if (s.isBusy) {
                            soldierStateLabel = "On Duty";
                            stateColorClass = "bg-blue-500";
                            bannerBg = "bg-blue-500/10 border-blue-500/20";
                        }

                        return (
                           <div key={s._id} className="p-4 bg-gray-900/80 rounded-2xl border border-gray-800 hover:border-gray-600 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 font-mono font-bold group-hover:text-white transition-colors shadow-inner">
                                     {s.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                     <h4 className="text-white font-bold tracking-wide text-sm">{s.name}</h4>
                                     <div className="flex items-center gap-2 mt-1">
                                        <span className="text-gray-500 font-mono text-[10px] bg-gray-950 px-1.5 py-0.5 rounded border border-gray-800">
                                          #{s.armyNumber}
                                        </span>
                                        {s.rank && (
                                          <span className="text-blue-400/80 text-[10px] font-semibold tracking-widest uppercase">{s.rank}</span>
                                        )}
                                     </div>
                                  </div>
                               </div>
                               
                               <div className={`flex flex-col sm:items-end p-2 rounded-lg border ${bannerBg} min-w-[120px]`}>
                                  <div className="flex items-center gap-1.5 mb-1">
                                     <span className={`w-1.5 h-1.5 rounded-full ${stateColorClass}`}></span>
                                     <span className="text-[10px] font-bold tracking-widest uppercase text-white">{soldierStateLabel}</span>
                                  </div>
                                  {s.isBusy && s.currentTask && (
                                     <span className="text-gray-400 text-[10px] truncate max-w-[120px] font-mono" title={s.currentTask.title}>
                                        {s.currentTask.title}
                                     </span>
                                  )}
                               </div>
                           </div>
                        );
                    })
                 )}
             </div>
          </div>
      </div>

      {/* Filtered Soldiers Modal */}
      {selectedCategory && (
        <Modal
          title={`${
            selectedCategory === 'free' ? 'Free Units' :
            selectedCategory === 'busy' ? 'Deployed / On Duty' :
            'On Leave'
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

    </div>
  );
};

export default ManagerDashboard;
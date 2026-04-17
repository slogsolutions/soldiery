import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { ShieldAlert, Activity, ChevronRight, Users, UserCheck, AlertCircle, Plus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import Modal from "../../components/ui/Modal";

interface User {
  _id: string;
  name: string;
  armyNumber: string;
  rank?: string;
  status?: string;
  manager?: {
    name: string;
    rank?: string;
    unit?: string;
    armyNumber: string;
  };
  isOnLeave?: boolean;
  leaveDetails?: {
    reason: string;
    startDate: string;
    endDate: string;
    finalDays: number;
  } | null;
}

const AdminDashboard = () => {
  const [managers, setManagers] = useState<User[]>([]);
  const [soldiers, setSoldiers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersonnel, setSelectedPersonnel] = useState<'managers' | 'soldiers' | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [managersRes, soldiersRes] = await Promise.all([
          api.get("/api/admin/managers"),
          api.get("/api/admin/soldiers")
        ]);

        if (managersRes.data.success) {
          setManagers(managersRes.data.data);
        } else {
          setError(managersRes.data.message || "Failed to load managers");
        }

        if (soldiersRes.data.success) {
          setSoldiers(soldiersRes.data.data);
        } else {
          setError(soldiersRes.data.message || "Failed to load soldiers");
        }
      } catch (err: any) {
        setError(err.message || "Failed to establish connection to command data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openManagers = () => setSelectedPersonnel("managers");
  const openSoldiers = () => setSelectedPersonnel("soldiers");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <ShieldAlert className="w-16 h-16 text-green-500 animate-pulse" />
          <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-ping"></div>
        </div>
        <p className="mt-6 text-green-400/80 font-mono tracking-[0.2em] uppercase text-sm animate-pulse">
          Syncing Nexus...
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

  const activeManagers = managers.filter(m => m.status === "active").length;
  const activeSoldiers = soldiers.filter(s => s.status === "active").length;

  const pieData = [
    { 
      name: 'Managers', 
      value: managers.length, 
      color: '#3b82f6',
      onClick: () => setSelectedPersonnel('managers')
    },
    { 
      name: 'Soldiers', 
      value: soldiers.length, 
      color: '#10b981',
      onClick: () => setSelectedPersonnel('soldiers')
    }
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800/60 pb-6 relative">
        <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-gradient-to-r from-green-500 to-transparent"></div>
        <div>
           <div className="flex items-center gap-2 mb-2">
             <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></span>
             <p className="text-green-500 text-xs tracking-[0.3em] uppercase font-mono">Operations Center</p>
           </div>
           <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">
             Deploy & Command
           </h1>
        </div>
        <button
           onClick={() => navigate("/admin/register-manager")}
           className="group relative overflow-hidden bg-white text-gray-950 hover:bg-gray-100 font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] flex items-center gap-2 text-sm"
        >
           <span className="relative z-10 flex items-center gap-2">
             <ShieldAlert size={16} /> Deploy New Manager
           </span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Managers */}
        <button
          type="button"
          onClick={openManagers}
          className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-4 backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-center gap-1 min-h-[100px] cursor-pointer hover:border-blue-500/40 hover:bg-gray-900/55 transition-all"
          aria-label="Show all managers"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-1">
            <UserCheck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-white tracking-tighter">{managers.length}</p>
          <p className="text-gray-400 text-[10px] uppercase tracking-[0.2em] font-medium">Total Managers</p>
          {activeManagers > 0 && (
            <span className="text-green-400 text-[10px] font-semibold tracking-wide bg-green-950/40 px-1.5 py-0.5 rounded border border-green-900/40 mt-1">
              {activeManagers} Active
            </span>
          )}
        </button>

        {/* Total Soldiers */}
        <button
          type="button"
          onClick={openSoldiers}
          className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-4 backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-center gap-1 min-h-[100px] cursor-pointer hover:border-green-500/40 hover:bg-gray-900/55 transition-all"
          aria-label="Show all soldiers"
        >
          <div className="w-8 h-8 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-1">
            <Users className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-3xl font-black text-white tracking-tighter">{soldiers.length}</p>
          <p className="text-gray-400 text-[10px] uppercase tracking-[0.2em] font-medium">Total Soldiers</p>
          {activeSoldiers > 0 && (
            <span className="text-green-400 text-[10px] font-semibold tracking-wide bg-green-950/40 px-1.5 py-0.5 rounded border border-green-900/40 mt-1">
              {activeSoldiers} Active
            </span>
          )}
        </button>

        {/* Pie Chart */}
        <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-md md:col-span-2">
          <h3 className="text-lg font-bold text-white tracking-wide mb-4">Personnel Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                onClick={(data) => data.onClick?.()}
                style={{ cursor: 'pointer' }}
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value, name) => [`${value} personnel`, name]}
              />
              <Legend 
                onClick={(entry) => entry.payload?.onClick?.()}
                wrapperStyle={{ cursor: 'pointer' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-gray-400 text-xs text-center mt-2">Click on a section to view details</p>
        </div>
      </div>

      {/* Permanent Manager Tiles */}
      <div className="bg-gray-900/25 border border-gray-800/60 rounded-3xl p-6 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-bold text-white tracking-wide">Managers</h3>
          <button
            type="button"
            onClick={openManagers}
            className="text-sm text-blue-300 hover:text-blue-200 transition-colors font-semibold tracking-wide"
          >
            View all
          </button>
        </div>

        {managers.length === 0 ? (
          <div className="p-10 text-center">
            <ShieldAlert size={40} className="text-gray-800 mx-auto mb-4 opacity-30" />
            <p className="text-gray-500 font-medium tracking-wide font-mono uppercase text-xs">
              No managers deployed in command units.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {managers.map((manager) => (
              <div
                key={manager._id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/admin/manager/${manager._id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") navigate(`/admin/manager/${manager._id}`);
                }}
                className="cursor-pointer bg-gray-900/40 border border-gray-800/80 rounded-2xl p-4 backdrop-blur-md hover:border-blue-500/30 transition-all shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_0_20px_rgba(59,130,246,0.08)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-900/30 border border-blue-800/50 flex items-center justify-center font-bold text-blue-300 shadow-inner">
                      {manager.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-bold tracking-wide">{manager.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-0.5">#{manager.armyNumber}</p>
                    </div>
                  </div>
                  <div className="text-gray-400 mt-1">
                    <ChevronRight size={16} />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-gray-400 font-semibold bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800">
                    {manager.rank ?? "Unranked"}
                  </span>
                  <span className="text-gray-400 font-semibold bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800">
                    {manager.unit ?? "—"}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${manager.status === "active" ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-gray-600"}`} />
                  <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">
                    {manager.status === "active" ? "Active" : manager.status || "Unknown"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Personnel Details Modal */}
      {selectedPersonnel && (
        <Modal
          title={selectedPersonnel === 'managers' ? 'All Managers' : 'All Soldiers'}
          onClose={() => setSelectedPersonnel(null)}
          size="lg"
        >
          {selectedPersonnel === 'managers' ? (
            // Managers List - Table Format
            managers.length === 0 ? (
              <div className="p-20 text-center">
                <ShieldAlert size={48} className="text-gray-800 mx-auto mb-4 opacity-30" />
                <p className="text-gray-500 font-medium tracking-wide font-mono uppercase text-xs">No managers deployed in command units.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-950/50">
                    <tr>
                      <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Manager</th>
                      <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Army ID</th>
                      <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Rank</th>
                      <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Unit</th>
                      <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Status</th>
                      <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40">
                    {managers.map((manager) => (
                      <tr key={manager._id} className="hover:bg-gray-800/30 transition-colors group">
                        {/* Manager Info */}
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-900/40 text-blue-400 border border-blue-800/50 flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-inner shadow-[inset_0_2px_10px_rgba(59,130,246,0.1)]">
                              {manager.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <button
                                onClick={() => {
                                  setSelectedPersonnel(null);
                                  navigate(`/admin/manager/${manager._id}`);
                                }}
                                className="font-bold text-white text-sm tracking-wide hover:text-blue-400 transition-colors text-left"
                              >
                                {manager.name}
                              </button>
                              <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-0.5">#{manager.armyNumber}</p>
                            </div>
                          </div>
                        </td>

                        {/* Army Number */}
                        <td className="px-6 py-5 text-gray-400 font-mono text-xs tracking-wider">#{manager.armyNumber}</td>

                        {/* Rank */}
                        <td className="px-6 py-5">
                          <span className="text-gray-400 font-semibold bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800">
                            {manager.rank ?? "Unranked"}
                          </span>
                        </td>

                        {/* Unit */}
                        <td className="px-6 py-5">
                          <span className="text-gray-400 font-semibold bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800">
                            {manager.unit ?? "—"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${manager.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-600'}`}></span>
                            <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">
                              {manager.status === 'active' ? 'Active' : manager.status || 'Unknown'}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-5">
                          <button
                            onClick={() => {
                              setSelectedPersonnel(null);
                              navigate(`/admin/manager/${manager._id}`);
                            }}
                            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800/50 rounded-lg"
                            title="View Manager Details"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            // Soldiers List - Table Format
            soldiers.length === 0 ? (
              <div className="p-20 text-center">
                <Users size={48} className="text-gray-800 mx-auto mb-4 opacity-30" />
                <p className="text-gray-500 font-medium tracking-wide font-mono uppercase text-xs">No soldiers found in registry.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-950/50">
                    <tr>
                      <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Soldier</th>
                      <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Army ID</th>
                      <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Rank</th>
                      <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Manager</th>
                      <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Status</th>
                      <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Leave Status</th>
                      <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40">
                    {soldiers.map((soldier) => (
                      <tr key={soldier._id} className="hover:bg-gray-800/30 transition-colors group">
                        {/* Soldier Info */}
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 border shadow-inner transition-all ${
                              soldier.isOnLeave 
                                ? "bg-yellow-900/40 text-yellow-400 border-yellow-800/50 shadow-[inset_0_2px_10px_rgba(234,179,8,0.1)]" 
                                : "bg-green-900/40 text-green-400 border-green-800/50 shadow-[inset_0_2px_10px_rgba(34,197,94,0.1)]"
                            }`}>
                              {soldier.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <button
                                onClick={() => {
                                  setSelectedPersonnel(null);
                                  navigate(`/admin/soldier/${soldier._id}`);
                                }}
                                className="font-bold text-white text-sm tracking-wide hover:text-green-400 transition-colors text-left"
                              >
                                {soldier.name}
                              </button>
                              <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-0.5">#{soldier.armyNumber}</p>
                            </div>
                          </div>
                        </td>

                        {/* Army Number */}
                        <td className="px-6 py-5 text-gray-400 font-mono text-xs tracking-wider">#{soldier.armyNumber}</td>

                        {/* Rank */}
                        <td className="px-6 py-5">
                          <span className="text-gray-400 font-semibold bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800">
                            {soldier.rank ?? "Unranked"}
                          </span>
                        </td>

                        {/* Manager */}
                        <td className="px-6 py-5">
                          {soldier.manager ? (
                            <div>
                              <p className="text-white font-medium text-sm">{soldier.manager.name}</p>
                              <p className="text-gray-500 text-xs">{soldier.manager.rank}</p>
                            </div>
                          ) : (
                            <span className="text-gray-600 text-xs italic">Unassigned</span>
                          )}
                        </td>

                        {/* Account Status */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${soldier.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-600'}`}></span>
                            <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">
                              {soldier.status === 'active' ? 'Active' : soldier.status || 'Unknown'}
                            </span>
                          </div>
                        </td>

                        {/* Leave Status */}
                        <td className="px-6 py-5">
                          {soldier.isOnLeave ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 text-yellow-400 font-bold text-[10px] tracking-widest uppercase bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 mb-1">
                                <AlertCircle size={10} /> On Leave
                              </span>
                              {soldier.leaveDetails && (
                                <p className="text-xs text-gray-400 max-w-[200px] truncate" title={soldier.leaveDetails.reason}>
                                  {soldier.leaveDetails.reason}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-green-400 font-bold text-[10px] tracking-widest uppercase bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]" /> Available
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPersonnel(null);
                              navigate(`/admin/assign-task/${soldier._id}`);
                            }}
                            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors px-3 py-2 hover:bg-blue-900/20 rounded-lg border border-blue-900/30"
                            title="Assign Task"
                          >
                            <Plus size={16} />
                            <span className="text-xs uppercase tracking-[0.2em] font-bold">Assign</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </Modal>
      )}

    </div>
  );
};

export default AdminDashboard;
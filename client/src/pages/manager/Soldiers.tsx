import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import {
  setSoldiers, updateSoldier,
  setSoldierLoading, setSoldierError,
} from "../../store/slices/soldierSlice";
import type { Soldier } from "../../store/slices/soldierSlice";
import api from "../../api/axios";
import { API_ROUTES } from "@/utils/constant";
import Badge from "../../components/ui/Badge";
import { AlertCircle, Filter, Users, ChevronRight, Activity, ShieldCheck } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type SoldierStatus = "pending" | "active" | "on_leave" | "inactive";

const STATUS_OPTIONS: { value: SoldierStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "inactive", label: "Inactive" },
];

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Units" },
  { value: "pending", label: "Pending Approval" },
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "inactive", label: "Inactive" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const extractError = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
};

// ─── Avatar ──────────────────────────────────────────────────────────────────

const Avatar = ({ name, isBusy }: { name: string; isBusy: boolean }) => (
  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 border shadow-inner transition-all ${
    isBusy 
      ? "bg-blue-900/40 text-blue-400 border-blue-800/50 shadow-[inset_0_2px_10px_rgba(59,130,246,0.1)]" 
      : "bg-green-900/40 text-green-400 border-green-800/50 shadow-[inset_0_2px_10px_rgba(34,197,94,0.1)]"
  }`}>
    {name.charAt(0).toUpperCase()}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ManagerSoldiers = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { soldiers, isLoading } = useSelector((s: RootState) => s.soldiers);
  const [filter, setFilter] = useState<string>("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchSoldiers = async (statusFilter: string) => {
    dispatch(setSoldierLoading(true));
    try {
      const query = statusFilter ? `?status=${statusFilter}` : "";
      const res = await api.get<{ success: boolean; data: Soldier[] }>(
        `${API_ROUTES.MANAGER}/soldiers${query}`
      );
      dispatch(setSoldiers(res.data.data));
    } catch (err: unknown) {
      dispatch(setSoldierError(extractError(err)));
    }
  };

  useEffect(() => {
    fetchSoldiers(filter);
  }, [filter]);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      const res = await api.patch<{ success: boolean; data: Soldier }>(
        `${API_ROUTES.MANAGER}/soldiers/${id}/approve`
      );
      dispatch(updateSoldier(res.data.data));
    } catch (err: unknown) {
      alert(extractError(err));
    } finally {
      setApprovingId(null);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await api.patch<{ success: boolean; data: Soldier }>(
        `${API_ROUTES.MANAGER}/soldiers/${id}/status`,
        { status }
      );
      dispatch(updateSoldier(res.data.data));
    } catch (err: unknown) {
      alert(extractError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = soldiers.filter((s) => s.status === "pending").length;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800/60 pb-6 relative">
        <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-gradient-to-r from-green-500 to-transparent"></div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></span>
            <p className="text-green-500 text-xs tracking-[0.3em] uppercase font-mono">Operations Roster</p>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">Soldier Registry</h1>
          <p className="text-gray-400 text-sm mt-1">Manage and monitor all active personnel in your unit</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
           <Filter size={16} className="text-gray-600 mr-2" />
           {FILTER_OPTIONS.map((o) => (
             <button
               key={o.value}
               onClick={() => setFilter(o.value)}
               className={`px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all border ${
                 filter === o.value 
                   ? "bg-green-900/40 text-green-400 border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.1)]" 
                   : "bg-gray-900 text-gray-500 border-gray-800 hover:text-gray-300 hover:border-gray-700"
               }`}
             >
               {o.label}
             </button>
           ))}
        </div>
      </div>

      {/* Pending Banner */}
      {pendingCount > 0 && (
        <div className="bg-orange-950/40 border border-orange-900/50 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-sm animate-pulse-slow">
          <AlertCircle className="text-orange-500 flex-shrink-0" size={20} />
          <p className="text-orange-400/90 text-sm font-semibold tracking-wide">
            HQ Alert: {pendingCount} new soldier account{pendingCount > 1 ? "s require" : " requires"} your authorization.
          </p>
        </div>
      )}

      {/* Roster Table */}
      <div className="bg-gray-900/40 border border-gray-800/80 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="p-6 border-b border-gray-800/50 bg-gray-900/40 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white tracking-wide">Personnel Matrix</h3>
          <span className="text-[10px] text-gray-600 font-mono tracking-widest uppercase font-bold bg-gray-950 px-2 py-1 rounded border border-gray-800">
             {soldiers.length} Operatives
          </span>
        </div>

        {isLoading ? (
          <div className="p-20 text-center animate-pulse">
            <Activity size={40} className="text-green-500 mx-auto mb-4" />
            <p className="text-green-500/60 font-mono uppercase tracking-[0.2em] text-xs">Syncing Registry...</p>
          </div>
        ) : !soldiers.length ? (
          <div className="p-20 text-center">
            <Users size={48} className="text-gray-800 mx-auto mb-4 opacity-30" />
            <p className="text-gray-500 font-medium tracking-wide font-mono uppercase text-xs">No operatives found in this category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-950/50">
                <tr>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Operative</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Registry ID</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Unit</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Operational Status</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Account Status</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Directives</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {soldiers.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-800/30 transition-colors group">
                    {/* Operative Info */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <Avatar name={s.name} isBusy={s.isBusy ?? false} />
                        <div>
                          <p className="font-bold text-white text-sm tracking-wide">{s.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-0.5">{s.rank ?? "Unranked"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Army No */}
                    <td className="px-6 py-5 text-gray-400 font-mono text-xs tracking-wider">#{s.armyNumber}</td>

                    {/* Unit */}
                    <td className="px-6 py-5">
                       <span className="text-gray-400 font-semibold bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800">
                          {s.unit ?? "—"}
                       </span>
                    </td>

                    {/* Operational Status (Job) */}
                    <td className="px-6 py-5">
                      {s.status === "active" ? (
                        s.isBusy ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 text-blue-400 font-bold text-[10px] tracking-widest uppercase bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 mb-1">
                               <Activity size={10} /> Deployed
                            </span>
                            {s.currentTask && (
                              <p className="text-xs text-gray-400 max-w-[200px] truncate" title={s.currentTask.title}>{s.currentTask.title}</p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-green-400 font-bold text-[10px] tracking-widest uppercase bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.05)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]" /> FREE
                          </span>
                        )
                      ) : (
                        <span className="text-gray-600 text-xs italic">N/A</span>
                      )}
                    </td>

                    {/* Account Status */}
                    <td className="px-6 py-5"><Badge status={s.status} /></td>

                    {/* Directives/Actions */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {s.status === "pending" ? (
                          <button
                            onClick={() => handleApprove(s._id)}
                            disabled={approvingId === s._id}
                            className="bg-green-600 text-white text-xs px-4 py-2 rounded-xl hover:bg-green-500 font-bold transition-all shadow-md shadow-green-900/20 flex items-center gap-1.5 group disabled:opacity-50"
                          >
                            <ShieldCheck size={14} className="group-hover:scale-110 transition-transform" />
                            {approvingId === s._id ? "Processing..." : "Authorize"}
                          </button>
                        ) : (
                          <select
                            value={s.status}
                            disabled={updatingId === s._id}
                            onChange={(e) => handleStatusChange(s._id, e.target.value)}
                            className="bg-gray-900 border border-gray-700 text-white text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-green-500/50 appearance-none disabled:opacity-50 transition-all cursor-pointer hover:border-gray-600"
                          >
                            {STATUS_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerSoldiers;
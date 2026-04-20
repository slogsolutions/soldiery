import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { AlertCircle, Filter, Users, ChevronRight, Activity, ShieldCheck, Plus } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type SoldierStatus = "pending" | "active" | "on_leave" | "inactive";

const STATUS_OPTIONS: { value: SoldierStatus; label: string }[] = [
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
  const navigate = useNavigate();
  const { soldiers, isLoading } = useSelector((s: RootState) => s.soldiers);
  const [filter, setFilter] = useState<string>("total");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchSoldiers = async () => {
    dispatch(setSoldierLoading(true));
    try {
      const res = await api.get<{ success: boolean; data: Soldier[] }>(
        `${API_ROUTES.MANAGER}/soldiers`
      );
      dispatch(setSoldiers(res.data.data));
    } catch (err: unknown) {
      dispatch(setSoldierError(extractError(err)));
    }
  };

  useEffect(() => {
    fetchSoldiers();
  }, []);

  const onDutyCount = soldiers.filter(s => s.isBusy && !s.isOnLeave).length;
  const onLeaveCount = soldiers.filter(s => s.isOnLeave).length;
  const freeCount = soldiers.filter(s => !s.isBusy && !s.isOnLeave).length;

  let filteredSoldiers = soldiers;
  if (filter === "on_duty") filteredSoldiers = soldiers.filter(s => s.isBusy && !s.isOnLeave);
  else if (filter === "on_leave") filteredSoldiers = soldiers.filter(s => s.isOnLeave);
  else if (filter === "free") filteredSoldiers = soldiers.filter(s => !s.isBusy && !s.isOnLeave);

  const FILTER_OPTIONS = [
    { value: "total", label: `Total (${soldiers.length})` },
    { value: "on_duty", label: `On Duty (${onDutyCount})` },
    { value: "on_leave", label: `On Leave (${onLeaveCount})` },
    { value: "free", label: `Free (${freeCount})` },
  ];



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



  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-end gap-4 border-b border-gray-800/60 pb-6 relative">
        <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-gradient-to-r from-green-500 to-transparent"></div>
        
        <div className="flex flex-wrap items-center gap-3">
           <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl px-2">
             <Filter size={14} className="text-gray-600 ml-2" />
             {FILTER_OPTIONS.map((o) => (
               <button
                 key={o.value}
                 onClick={() => setFilter(o.value)}
                 className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all ${
                   filter === o.value 
                     ? "text-green-400" 
                     : "text-gray-500 hover:text-gray-300"
                 }`}
               >
                 {o.label}
               </button>
             ))}
           </div>

           <button
             onClick={() => navigate("/manager/RegisterSoldier")}
             className="bg-green-600 text-white text-xs px-4 py-2.5 rounded-xl hover:bg-green-500 font-bold transition-all shadow-lg shadow-green-900/20 flex items-center gap-2"
           >
             <Plus size={16} /> Register Soldier
           </button>
        </div>
      </div>



      {/* Roster Table */}
      <div className="bg-gray-900/40 border border-gray-800/80 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="p-6 border-b border-gray-800/50 bg-gray-900/40 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white tracking-wide">Personnel Matrix</h3>
          <span className="text-[10px] text-gray-600 font-mono tracking-widest uppercase font-bold bg-gray-950 px-2 py-1 rounded border border-gray-800">
             {filteredSoldiers.length} Operatives
          </span>
        </div>

        {isLoading ? (
          <div className="p-20 text-center animate-pulse">
            <Activity size={40} className="text-green-500 mx-auto mb-4" />
            <p className="text-green-500/60 font-mono uppercase tracking-[0.2em] text-xs">Syncing Registry...</p>
          </div>
        ) : !filteredSoldiers.length ? (
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
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {filteredSoldiers.map((s) => (
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
                        s.isOnLeave ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-400 font-bold text-[10px] tracking-widest uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.05)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_5px_#f59e0b]" /> ON LEAVE
                          </span>
                        ) : s.isBusy ? (
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
                    <td className="px-6 py-5">
                      <Badge status={s.isOnLeave ? "on_leave" : s.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/manager/assign-task/${s._id}`)}
                          className="whitespace-nowrap bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 border border-blue-900/50 text-[10px] uppercase tracking-widest font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Plus size={14} /> Assign Task
                        </button>
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
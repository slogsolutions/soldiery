import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import {
  setLeaves,
  updateLeave,
  removeLeave,
  setLeaveLoading,
  setLeaveError,
} from "../../store/slices/leaveSlice";
import type { Leave } from "../../store/slices/leaveSlice";
import api from "../../api/axios";
import Modal from "../../components/ui/Modal";
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Activity,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const extractError = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// ─── Modal Forms ─────────────────────────────────────────────────────────────

const AdminActionForm = ({ 
  type, 
  onConfirm, 
  onCancel, 
  loading 
}: { 
  type: "approve" | "reject"; 
  onConfirm: (note?: string) => void; 
  onCancel: () => void; 
  loading: boolean;
}) => {
  const [note, setNote] = useState("");
  return (
    <div className="space-y-5">
      <p className="text-gray-300 text-sm">
        {type === "approve" 
          ? "Confirm final HQ approval for this leave request. This will update the soldier's record globally."
          : "Please provide the final rejection reason from HQ."}
      </p>
      
      {type === "reject" && (
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 tracking-widest uppercase">Admin Note *</label>
          <textarea
            required
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Final decision reasoning..."
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
            rows={3}
          />
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-all">
          Cancel
        </button>
        <button 
          onClick={() => onConfirm(type === "reject" ? note : undefined)} 
          disabled={loading || (type === "reject" && !note.trim())}
          className={`flex-1 ${type === 'approve' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'} text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg`}
        >
          {loading ? "Processing..." : type === "approve" ? "Final Approve" : "Final Reject"}
        </button>
      </div>
    </div>
  );
};

const AdminEditForm = ({
  finalDays,
  onChange,
  onConfirm,
  onCancel,
  loading,
}: {
  finalDays: number;
  onChange: (value: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) => (
  <div className="space-y-5">
    <div>
      <p className="text-gray-300 text-sm mb-2">Adjust the number of approved leave days before authorizing the request.</p>
      <label className="block text-xs font-semibold text-gray-400 mb-1.5 tracking-widest uppercase">Final Leave Days</label>
      <input
        type="number"
        min={1}
        value={finalDays}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
      />
      <p className="text-gray-500 text-xs mt-2">Keep this value accurate to the leave period after HQ adjustment.</p>
    </div>
    <div className="flex gap-3">
      <button onClick={onCancel} className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-all">
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={loading || finalDays <= 0}
        className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-500 transition-all shadow-lg"
      >
        {loading ? "Updating..." : "Update Days"}
      </button>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminLeaves = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { leaves, isLoading } = useSelector((s: RootState) => s.leaves);
  const [activeModal, setActiveModal] = useState<"approve" | "reject" | "edit" | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [editDays, setEditDays] = useState<number>(0);

  const fetchAdminLeaves = useCallback(async () => {
    dispatch(setLeaveLoading(true));
    try {
      const res = await api.get("/api/leaves/admin/leaves");
      dispatch(setLeaves(res.data.data));
    } catch (err: unknown) {
      dispatch(setLeaveError(extractError(err)));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchAdminLeaves();
  }, [fetchAdminLeaves]);

  const handleAction = async (data?: string) => {
    if (!selectedLeave || !activeModal) return;
    setActionLoading(true);
    try {
      const baseUrl = `/api/leaves/admin/leaves/${selectedLeave._id}`;
      let res;
      
      if (activeModal === "approve") {
        res = await api.patch(`${baseUrl}/approve`);
      } else if (activeModal === "reject") {
        res = await api.patch(`${baseUrl}/reject`, { adminNote: data });
      }

      if (res?.data?.success) {
        if (activeModal === "approve" || activeModal === "reject") {
          dispatch(removeLeave(res.data.data._id));
        } else {
          dispatch(updateLeave(res.data.data));
        }
        setActiveModal(null);
        setSelectedLeave(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || extractError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditDays = async () => {
    if (!selectedLeave) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/api/leaves/admin/leaves/${selectedLeave._id}/edit`, {
        finalDays: editDays,
      });

      if (res?.data?.success) {
        dispatch(updateLeave(res.data.data));
        setActiveModal(null);
        setSelectedLeave(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || extractError(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800/60 pb-6 relative">
        <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-gradient-to-r from-blue-500 to-transparent"></div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></span>
            <p className="text-blue-500 text-xs tracking-[0.3em] uppercase font-mono">High Command HQ</p>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">Final Review Console</h1>
          <p className="text-gray-400 text-sm mt-1">Authorized leave oversight and system-wide approvals</p>
        </div>
        
        <div className="bg-gray-900/60 border border-blue-900/30 rounded-2xl px-5 py-3 backdrop-blur-md flex items-center gap-4">
           <div className="text-right">
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Leaves Pending HQ</p>
              <p className="text-2xl font-black text-white leading-none">{leaves.length}</p>
           </div>
           <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
              <ShieldCheck size={20} />
           </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-gray-900/40 border border-gray-800/80 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="p-6 border-b border-gray-800/50 bg-gray-900/40">
          <h3 className="text-lg font-bold text-white tracking-wide">Manager-Escalated Leave Reports</h3>
        </div>

        {isLoading ? (
          <div className="p-20 text-center animate-pulse">
            <Activity size={40} className="text-blue-500 mx-auto mb-4" />
            <p className="text-blue-500/60 font-mono uppercase tracking-[0.2em] text-xs">Accessing Encrypted Records...</p>
          </div>
        ) : leaves.length === 0 ? (
          <div className="p-20 text-center">
            <ShieldCheck size={48} className="text-gray-800 mx-auto mb-4 opacity-30" />
            <p className="text-gray-500 font-medium tracking-wide font-mono uppercase text-xs">Global Registry Clear</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-950/50">
                <tr>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase text-[10px]">Personnel & Forwarder</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase text-[10px]">Schedule</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase text-[10px]">Justification</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase text-[10px]">Manager Note</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {leaves.map((leave) => {
                   const soldier = typeof leave.soldier === 'object' ? leave.soldier : { name: 'Unknown', armyNumber: '0000', rank: '' };
                   const manager = typeof leave.managerId === 'object' ? leave.managerId : { name: 'Assigned Manager' };
                   return (
                     <tr key={leave._id} className="hover:bg-gray-800/30 transition-colors group">
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 font-bold border border-gray-700 shadow-inner group-hover:bg-blue-900/30 group-hover:text-blue-400 group-hover:border-blue-800/50 transition-all">
                               {soldier.name.charAt(0)}
                            </div>
                            <div>
                               <p className="font-bold text-white text-sm">{soldier.name}</p>
                               <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
                                  Unit Liaison: {manager.name}
                               </p>
                            </div>
                         </div>
                       </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-300 text-[11px] font-mono mb-1">
                          {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                        </div>
                        <span className="text-blue-400 font-bold text-[10px] bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.05)] uppercase tracking-wider">
                           {leave.finalDays || leave.originalDays} HQ Days
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-400 text-xs leading-relaxed italic max-w-sm line-clamp-2">"{leave.reason}"</p>
                      </td>
                      <td className="px-6 py-4">
                        {leave.managerNote ? (
                           <div className="p-2 rounded bg-orange-950/20 border border-orange-900/20 max-w-[200px]">
                              <p className="text-orange-400/80 text-[10px] leading-tight line-clamp-2">
                                 "{leave.managerNote}"
                              </p>
                           </div>
                        ) : (
                           <span className="text-gray-600 italic text-[10px]">No unit notes</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button 
                            onClick={() => { setSelectedLeave(leave); setActiveModal("approve"); }}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-500 transition-all flex items-center gap-1.5 shadow-md shadow-green-900/20"
                          >
                            <CheckCircle2 size={14} /> APPROVE
                          </button>
                          <button 
                            onClick={() => { setSelectedLeave(leave); setEditDays(leave.finalDays); setActiveModal("edit"); }}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-500 transition-all flex items-center gap-1.5 shadow-md shadow-blue-900/20"
                          >
                            <Clock size={14} /> EDIT DAYS
                          </button>
                          <button 
                            onClick={() => { setSelectedLeave(leave); setActiveModal("reject"); }}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-500 transition-all flex items-center gap-1.5 shadow-md shadow-red-900/20"
                          >
                            <XCircle size={14} /> DENY
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {activeModal && selectedLeave && (
        <Modal
          title={
            activeModal === 'edit'
              ? 'Adjust Leave Days'
              : activeModal === 'approve'
              ? 'Final HQ Authorization'
              : 'HQ Registry Rejection'
          }
          onClose={() => {
            setActiveModal(null);
            setSelectedLeave(null);
          }}
          size="md"
        >
          {activeModal === 'edit' ? (
            <AdminEditForm
              finalDays={editDays}
              onChange={(value) => setEditDays(value)}
              onConfirm={handleEditDays}
              onCancel={() => {
                setActiveModal(null);
                setSelectedLeave(null);
              }}
              loading={actionLoading}
            />
          ) : (
            <AdminActionForm
              type={activeModal}
              onConfirm={(note) => handleAction(note)}
              onCancel={() => {
                setActiveModal(null);
                setSelectedLeave(null);
              }}
              loading={actionLoading}
            />
          )}
        </Modal>
      )}

    </div>
  );
};

export default AdminLeaves;

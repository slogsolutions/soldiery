import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../../store/store";
import {
  setLeaves,
  updateLeave,
  setLeaveLoading,
  setLeaveError,
} from "../../store/slices/leaveSlice";
import type { Leave } from "../../store/slices/leaveSlice";
import api from "../../api/axios";
import Modal from "../../components/ui/Modal";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Send,
  Pencil,
  AlertCircle,
  Filter,
  User,
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

// ─── Filter Constants ────────────────────────────────────────────────────────

const TAB_OPTIONS = [
  { label: "Pending Inbox", value: "pending" },
  { label: "Active Deployments", value: "active" },
  { label: "Unit Logbook", value: "history" },
];

// ─── Modal Forms ─────────────────────────────────────────────────────────────

const ActionForm = ({ 
  type, 
  onConfirm, 
  onCancel, 
  loading 
}: { 
  type: "approve" | "send-to-admin"; 
  onConfirm: () => void; 
  onCancel: () => void; 
  loading: boolean;
}) => (
  <div className="space-y-6">
    <p className="text-gray-300 text-sm">
      {type === "approve" 
        ? "Are you sure you want to approve this leave request? This is a final action for this unit."
        : "Are you sure you want to forward this request to the Admin for final review?"}
    </p>
    <div className="flex gap-3">
      <button onClick={onCancel} className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-all">
        Cancel
      </button>
      <button 
        onClick={onConfirm} 
        disabled={loading}
        className={`flex-1 ${type === 'approve' ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'} text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg`}
      >
        {loading ? "Processing..." : type === "approve" ? "Confirm Approval" : "Confirm Forward"}
      </button>
    </div>
  </div>
);

const RejectForm = ({ 
  onConfirm, 
  onCancel, 
  loading 
}: { 
  onConfirm: (note: string) => void; 
  onCancel: () => void; 
  loading: boolean;
}) => {
  const [note, setNote] = useState("");
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5 tracking-widest uppercase">Rejection Reason *</label>
        <textarea
          required
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Please provide a reason for rejection..."
          className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
          rows={3}
        />
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-all">
          Cancel
        </button>
        <button 
          onClick={() => onConfirm(note)} 
          disabled={loading || !note.trim()}
          className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-500 disabled:opacity-50 transition-all shadow-lg"
        >
          {loading ? "Rejecting..." : "Confirm Rejection"}
        </button>
      </div>
    </div>
  );
};

const EditForm = ({ 
  leave,
  onConfirm, 
  onCancel, 
  loading 
}: { 
  leave: Leave;
  onConfirm: (data: { finalDays: number; managerNote: string }) => void; 
  onCancel: () => void; 
  loading: boolean;
}) => {
  const [days, setDays] = useState(leave.finalDays || leave.originalDays);
  const [note, setNote] = useState(leave.managerNote || "");
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5 tracking-widest uppercase">Revised Days</label>
        <input
          type="number"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5 tracking-widest uppercase">Manager Note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Additional notes or adjustments..."
          className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none"
          rows={3}
        />
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-all">
          Cancel
        </button>
        <button 
          onClick={() => onConfirm({ finalDays: days, managerNote: note })} 
          disabled={loading}
          className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-500 transition-all shadow-lg"
        >
          {loading ? "Updating..." : "Update Request"}
        </button>
      </div>
    </div>
  );
};

const ModifyActiveForm = ({ 
  leave,
  onConfirm, 
  onCancel, 
  loading 
}: { 
  leave: Leave;
  onConfirm: (data: { endDate: string }) => void; 
  onCancel: () => void; 
  loading: boolean;
}) => {
  const [endDate, setEndDate] = useState(leave.endDate ? new Date(leave.endDate).toISOString().split('T')[0] : "");
  
  return (
    <div className="space-y-4">
      <p className="text-gray-400 text-sm mb-4">You are modifying an active deployment absence. Setting the end date to today will immediately return the operative to active duty.</p>
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5 tracking-widest uppercase">New Return Date</label>
        <input
          type="date"
          value={endDate}
          min={new Date(leave.startDate).toISOString().split('T')[0]}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={() => setEndDate(new Date().toISOString().split('T')[0])} className="flex-1 bg-blue-900/40 text-blue-400 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-900/60 border border-blue-800/50 transition-all">
          Return To Duty Today
        </button>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-all">
          Cancel
        </button>
        <button 
          onClick={() => onConfirm({ endDate })} 
          disabled={loading || !endDate}
          className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-500 transition-all shadow-lg"
        >
          {loading ? "Updating..." : "Confirm Schedule"}
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ManagerLeaves = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id: soldierId } = useParams<{ id: string }>();
  const { leaves, isLoading } = useSelector((s: RootState) => s.leaves);
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "history">("pending");
  
  // Modal states
  const [activeModal, setActiveModal] = useState<"approve" | "reject" | "edit" | "send-to-admin" | "modify-active" | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Apply leave form state
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyFormData, setApplyFormData] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    originalDays: 0
  });
  const [soldier, setSoldier] = useState<{ _id: string; name: string } | null>(null);

  const fetchLeaves = useCallback(async () => {
    dispatch(setLeaveLoading(true));
    try {
      const res = await api.get("/api/leaves/manager/leaves");
      dispatch(setLeaves(res.data.data));
    } catch (err: unknown) {
      dispatch(setLeaveError(extractError(err)));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchLeaves();
    
    // If soldierId is present, fetch soldier data and show apply form
    if (soldierId) {
      fetchSoldierData();
      setShowApplyForm(true);
    }
  }, [soldierId, fetchLeaves, fetchSoldierData]);

  const fetchSoldierData = useCallback(async () => {
    try {
      const res = await api.get(`/api/manager/soldiers/${soldierId}`);
      if (res.data.success) {
        setSoldier(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch soldier data:', err);
    }
  }, [soldierId]);

  const handleApplyLeave = async () => {
    if (!soldier || !applyFormData.startDate || !applyFormData.endDate || !applyFormData.reason.trim()) return;

    setActionLoading(true);
    try {
      const startDate = new Date(applyFormData.startDate);
      const endDate = new Date(applyFormData.endDate);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const leaveData = {
        soldier: soldier._id,
        startDate: applyFormData.startDate,
        endDate: applyFormData.endDate,
        originalDays: daysDiff,
        reason: applyFormData.reason,
        manager: null // Will be set by backend
      };

      const res = await api.post('/api/leaves/manager/apply', leaveData);
      
      if (res.data.success) {
        // Reset form and close modal
        setApplyFormData({ startDate: "", endDate: "", reason: "", originalDays: 0 });
        setShowApplyForm(false);
        if (soldierId) navigate('/manager/leaves');
        
        // Refresh leaves list
        fetchLeaves();
      }
    } catch (err: any) {
      console.error('Failed to apply leave:', err);
    } finally {
      setActionLoading(false);
    }
  };
  const handleAction = async (type: string, data?: any) => {
    if (!selectedLeave) return;
    setActionLoading(true);
    try {
      let res;
      const baseUrl = `/api/leaves/manager/leaves/${selectedLeave._id}`;
      
      if (type === "approve") {
        res = await api.patch(`${baseUrl}/approve`);
      } else if (type === "reject") {
        res = await api.patch(`${baseUrl}/reject`, { managerNote: data });
      } else if (type === "edit") {
        res = await api.patch(`${baseUrl}/edit`, data);
      } else if (type === "send-to-admin") {
        res = await api.patch(`${baseUrl}/send-to-admin`);
      }
      
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

  const filteredLeaves = leaves.filter(leave => {
    const isApproved = leave.status === "approved";
    const isPending = leave.status === "pending";
    const isRejected = leave.status === "rejected";
    const isSentToAdmin = leave.status === "approved_by_manager";
      
    const now = new Date();
    now.setHours(0,0,0,0);
    const leaveEndDate = new Date(leave.endDate);
    leaveEndDate.setHours(23,59,59,999);
      
    const isActiveOrUpcoming = isApproved && leaveEndDate >= now;
    const isCompleted = isApproved && leaveEndDate < now;

    if (activeTab === "pending") return isPending;
    if (activeTab === "active") return isActiveOrUpcoming;
    if (activeTab === "history") return isRejected || isSentToAdmin || isCompleted;
    return true;
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800/60 pb-6 relative">
        <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-gradient-to-r from-green-500 to-transparent"></div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></span>
            <p className="text-green-500 text-xs tracking-[0.3em] uppercase font-mono">Operations Command</p>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">Leave Approvals</h1>
          <p className="text-gray-400 text-sm mt-1">Review and manage leave requests from your personnel</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
           <Filter size={16} className="text-gray-600 mr-2" />
           {TAB_OPTIONS.map((f) => (
             <button
               key={f.value}
               onClick={() => setActiveTab(f.value as any)}
               className={`px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all border ${
                 activeTab === f.value 
                   ? "bg-green-900/40 text-green-400 border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.1)]" 
                   : "bg-gray-900 text-gray-500 border-gray-800 hover:text-gray-300 hover:border-gray-700"
               }`}
             >
               {f.label}
             </button>
           ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-gray-900/40 border border-gray-800/80 rounded-3xl overflow-hidden backdrop-blur-md">
        <div className="p-6 border-b border-gray-800/50 bg-gray-900/40 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white tracking-wide">Personnel Requests</h3>
          <span className="text-[10px] text-gray-600 font-mono tracking-widest uppercase font-bold bg-gray-950 px-2 py-1 rounded border border-gray-800">
             {filteredLeaves.length} Total Hits
          </span>
        </div>

        {isLoading ? (
          <div className="p-20 text-center animate-pulse">
            <Clock size={40} className="text-green-500 mx-auto mb-4" />
            <p className="text-green-500/60 font-mono uppercase tracking-[0.2em] text-xs">Awaiting Data Sync...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="p-20 text-center">
            <AlertCircle size={48} className="text-gray-800 mx-auto mb-4 opacity-30" />
            <p className="text-gray-500 font-medium tracking-wide font-mono uppercase text-xs">No matching reports found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-950/50">
                <tr>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Personnel</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Duration</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Reason</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Status</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {filteredLeaves.map((leave) => {
                  const soldier = typeof leave.soldier === 'object' ? leave.soldier : { name: 'Unknown', armyNumber: '0000', rank: '' };
                  return (
                    <tr key={leave._id} className="hover:bg-gray-800/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 font-bold border border-gray-700 shadow-inner group-hover:bg-green-900/30 group-hover:text-green-400 group-hover:border-green-800/50 transition-all">
                              {soldier.name.charAt(0)}
                           </div>
                           <div>
                              <p className="font-bold text-white text-sm">{soldier.name}</p>
                              <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase border-gray-800">
                                 {soldier.rank} · #{soldier.armyNumber}
                              </p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-300 text-[11px] font-mono mb-1">
                          {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                        </div>
                        <span className="text-green-400 font-bold text-[10px] bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.05)] uppercase tracking-wider">
                           {leave.finalDays || leave.originalDays} Days Allocated
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-400 text-xs leading-relaxed italic max-w-sm line-clamp-2">"{leave.reason}"</p>
                      </td>
                      <td className="px-6 py-4">
                        {activeTab === "pending" && (
                          <span className="text-yellow-400 text-[10px] font-black tracking-widest border border-yellow-900/50 px-2 py-0.5 rounded bg-yellow-950/30 uppercase">PENDING REVIEW</span>
                        )}
                        {activeTab === "active" && (
                           new Date(leave.startDate) > new Date() 
                             ? <span className="text-blue-400 text-[10px] font-black tracking-widest border border-blue-900/50 px-2 py-0.5 rounded bg-blue-950/30 uppercase">SCHEDULED / UPCOMING</span>
                             : <span className="text-green-400 text-[10px] font-black tracking-widest border border-green-900/50 px-2 py-0.5 rounded bg-green-950/30 uppercase animate-pulse">ACTIVE NOW</span>
                        )}
                        {activeTab === "history" && (
                           leave.status === "rejected" ? <span className="text-red-400 text-[10px] font-black tracking-widest border border-red-900/50 px-2 py-0.5 rounded bg-red-950/30 uppercase">REJECTED</span> :
                           leave.status === "approved_by_manager" ? <span className="text-purple-400 text-[10px] font-black tracking-widest border border-purple-900/50 px-2 py-0.5 rounded bg-purple-950/30 uppercase">ESCALATED TO HQ</span> :
                           <span className="text-gray-400 text-[10px] font-black tracking-widest border border-gray-800/80 px-2 py-0.5 rounded bg-gray-900/50 uppercase">COMPLETED & RETURNED</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {activeTab === "pending" && (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => { setSelectedLeave(leave); setActiveModal("approve"); }}
                              className="w-8 h-8 rounded-lg bg-green-600/20 text-green-500 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-sm"
                              title="Approve Final"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button 
                              onClick={() => { setSelectedLeave(leave); setActiveModal("reject"); }}
                              className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                              title="Reject"
                            >
                              <XCircle size={16} />
                            </button>
                            <button 
                              onClick={() => { setSelectedLeave(leave); setActiveModal("edit"); }}
                              className="w-8 h-8 rounded-lg bg-gray-800 text-gray-400 flex items-center justify-center hover:bg-white hover:text-gray-900 transition-all shadow-sm"
                              title="Edit Details"
                            >
                              <Pencil size={16} />
                            </button>
                            <button 
                              onClick={() => { setSelectedLeave(leave); setActiveModal("send-to-admin"); }}
                              className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-500 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              title="Send to HQ"
                            >
                              <Send size={16} />
                            </button>
                          </div>
                        )}
                        {activeTab === "active" && (
                          <button
                            onClick={() => { setSelectedLeave(leave); setActiveModal("modify-active"); }}
                            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-blue-900/30 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          >
                            Manage Active Leave
                          </button>
                        )}
                        {activeTab === "history" && (
                          leave.status === "approved" ? (
                            <button
                              onClick={() => { setSelectedLeave(leave); setActiveModal("modify-active"); }}
                              className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-gray-800 text-gray-400 border border-gray-700 rounded-lg hover:bg-gray-600 hover:text-white transition-all shadow-sm"
                            >
                              Amend Record
                            </button>
                          ) : (
                            <span className="text-gray-600 text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
                               <CheckCircle2 size={14} className="opacity-50" /> Logged
                            </span>
                          )
                        )}
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
      {activeModal === "approve" && selectedLeave && (
        <Modal title="Confirm Final Approval" onClose={() => setActiveModal(null)} size="sm">
          <ActionForm type="approve" onConfirm={() => handleAction("approve")} onCancel={() => setActiveModal(null)} loading={actionLoading} />
        </Modal>
      )}
      
      {activeModal === "send-to-admin" && selectedLeave && (
        <Modal title="Escalate to HQ" onClose={() => setActiveModal(null)} size="sm">
          <ActionForm type="send-to-admin" onConfirm={() => handleAction("send-to-admin")} onCancel={() => setActiveModal(null)} loading={actionLoading} />
        </Modal>
      )}

      {activeModal === "reject" && selectedLeave && (
        <Modal title="Deny Leave Request" onClose={() => setActiveModal(null)} size="md">
          <RejectForm onConfirm={(note) => handleAction("reject", note)} onCancel={() => setActiveModal(null)} loading={actionLoading} />
        </Modal>
      )}

      {activeModal === "edit" && selectedLeave && (
        <Modal title="Revise Request Parameters" onClose={() => setActiveModal(null)} size="md">
          <EditForm leave={selectedLeave} onConfirm={(data) => handleAction("edit", data)} onCancel={() => setActiveModal(null)} loading={actionLoading} />
        </Modal>
      )}

      {activeModal === "modify-active" && selectedLeave && (
        <Modal title="Modify Active Leave Schedule" onClose={() => setActiveModal(null)} size="md">
          <ModifyActiveForm leave={selectedLeave} onConfirm={(data) => handleAction("edit", data)} onCancel={() => setActiveModal(null)} loading={actionLoading} />
        </Modal>
      )}

      {/* Apply Leave Form Modal */}
      {showApplyForm && soldier && (
        <Modal 
          title={`Apply Leave for ${soldier.name}`} 
          onClose={() => {
            setShowApplyForm(false);
            if (soldierId) navigate('/manager/leaves');
          }} 
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-900/40 border border-blue-800 flex items-center justify-center text-blue-400">
                  <User size={20} />
                </div>
                <div>
                  <p className="font-bold text-white">{soldier.name}</p>
                  <p className="text-xs text-gray-400">#{soldier.armyNumber} • {soldier.rank || 'Unranked'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 tracking-widest uppercase">Start Date *</label>
                <input
                  type="date"
                  value={applyFormData.startDate}
                  onChange={(e) => setApplyFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 tracking-widest uppercase">End Date *</label>
                <input
                  type="date"
                  value={applyFormData.endDate}
                  onChange={(e) => setApplyFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 tracking-widest uppercase">Reason *</label>
              <textarea
                value={applyFormData.reason}
                onChange={(e) => setApplyFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter leave reason..."
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowApplyForm(false);
                  if (soldierId) navigate('/manager/leaves');
                }}
                className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyLeave}
                disabled={!applyFormData.startDate || !applyFormData.endDate || !applyFormData.reason.trim() || actionLoading}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-all font-semibold text-sm"
              >
                {actionLoading ? "Submitting..." : "Apply Leave"}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default ManagerLeaves;

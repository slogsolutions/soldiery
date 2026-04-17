import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import {
  setLeaves,
  addLeave,
  setLeaveLoading,
  setLeaveError,
} from "../../store/slices/leaveSlice";
import type { Leave } from "../../store/slices/leaveSlice";
import api from "../../api/axios";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import { 
  Clock, 
  Calendar, 
  FileText, 
  Plus, 
  AlertCircle, 
  ChevronRight,
  History,
  Info
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

// ─── Leave Form ──────────────────────────────────────────────────────────────

interface LeaveFormProps {
  form: { reason: string; startDate: string; endDate: string };
  error: string | null;
  loading: boolean;
  onChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const LeaveForm = ({ form, error, loading, onChange, onSubmit, onCancel }: LeaveFormProps) => (
  <form onSubmit={onSubmit} className="space-y-5">
    {error && (
      <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl flex items-center gap-2">
        <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )}
    
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-1.5 tracking-widest uppercase">
        Leave Reason *
      </label>
      <textarea
        required
        value={form.reason}
        onChange={(e) => onChange("reason", e.target.value)}
        placeholder="Reason for leave request..."
        className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none transition-all"
        rows={3}
      />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5 tracking-widest uppercase">
          Start Date *
        </label>
        <div className="relative">
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="date"
            required
            value={form.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5 tracking-widest uppercase">
          End Date *
        </label>
        <div className="relative">
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="date"
            required
            value={form.endDate}
            onChange={(e) => onChange("endDate", e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
          />
        </div>
      </div>
    </div>

    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-all"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-500 disabled:opacity-60 transition-all shadow-[0_0_20px_rgba(34,197,94,0.15)]"
      >
        {loading ? "Submitting..." : "Submit Request"}
      </button>
    </div>
  </form>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const SoldierLeaves = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { leaves, isLoading, error } = useSelector((s: RootState) => s.leaves);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [form, setForm] = useState({ reason: "", startDate: "", endDate: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchLeaves = async () => {
    dispatch(setLeaveLoading(true));
    try {
      const res = await api.get("/api/leaves/soldier/leaves");
      dispatch(setLeaves(res.data.data));
    } catch (err: unknown) {
      dispatch(setLeaveError(extractError(err)));
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await api.post("/api/leaves/soldier/leaves", form);
      dispatch(addLeave(res.data.data));
      setShowApplyModal(false);
      setForm({ reason: "", startDate: "", endDate: "" });
    } catch (err: any) {
      setFormError(err.response?.data?.message || extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800/60 pb-6 relative">
        <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-gradient-to-r from-green-500 to-transparent"></div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></span>
            <p className="text-green-500 text-xs tracking-[0.3em] uppercase font-mono">Personal Records</p>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">Leave Management</h1>
          <p className="text-gray-400 text-sm mt-1">Track your leave requests and operational status</p>
        </div>
        <button
          onClick={() => setShowApplyModal(true)}
          className="group relative overflow-hidden bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-[0_0_25px_rgba(34,197,94,0.2)] hover:bg-green-500"
        >
          <Plus size={16} /> New Application
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-5 backdrop-blur-md">
           <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">
             <History size={14} /> Total Requests
           </div>
           <p className="text-3xl font-black text-white">{leaves.length}</p>
        </div>
        <div className="bg-gray-900/40 border border-green-900/30 rounded-2xl p-5 backdrop-blur-md">
           <div className="flex items-center gap-2 text-green-500/80 text-[10px] font-bold uppercase tracking-widest mb-3">
             <Info size={14} /> Approved
           </div>
           <p className="text-3xl font-black text-green-400">{leaves.filter(l => l.status === 'approved').length}</p>
        </div>
        <div className="bg-gray-900/40 border border-orange-900/30 rounded-2xl p-5 backdrop-blur-md">
           <div className="flex items-center gap-2 text-orange-500/80 text-[10px] font-bold uppercase tracking-widest mb-3">
             <Clock size={14} /> Pending
           </div>
           <p className="text-3xl font-black text-orange-400">{leaves.filter(l => l.status === 'pending' || l.status === 'approved_by_manager').length}</p>
        </div>
      </div>

      {/* Leave List */}
      <div className="bg-gray-900/40 border border-gray-800/80 rounded-3xl overflow-hidden backdrop-blur-md">
        <div className="p-6 border-b border-gray-800/50 bg-gray-900/40">
          <h3 className="text-lg font-bold text-white tracking-wide">Leave History</h3>
        </div>

        {leaves.length === 0 ? (
          <div className="p-16 text-center">
            <Clock size={48} className="text-gray-800 mx-auto mb-4 opacity-30" />
            <p className="text-gray-500 font-medium tracking-wide">No leave applications found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-950/50">
                <tr>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Dates</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Reason</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Duration</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Status</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-400 text-xs tracking-widest uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-300 font-medium">
                        {formatDate(leave.startDate)} <ChevronRight size={12} className="text-gray-600" /> {formatDate(leave.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-400 max-w-xs truncate" title={leave.reason}>{leave.reason}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-mono bg-gray-800 px-2 py-1 rounded text-xs border border-gray-700">
                        {leave.finalDays || leave.originalDays} Days
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={leave.status} />
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {leave.managerNote && (
                        <p className="text-gray-500"><span className="text-orange-500/70 font-bold uppercase text-[9px]">Manager:</span> {leave.managerNote}</p>
                      )}
                      {leave.adminNote && (
                        <p className="text-gray-500 mt-1"><span className="text-blue-500/70 font-bold uppercase text-[9px]">Admin:</span> {leave.adminNote}</p>
                      )}
                      {!leave.managerNote && !leave.adminNote && (
                        <span className="text-gray-600 italic">No notes</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <Modal title="Apply for Leave" onClose={() => setShowApplyModal(false)}>
          <LeaveForm
            form={form}
            error={formError}
            loading={submitting}
            onChange={(f, v) => setForm(prev => ({ ...prev, [f]: v }))}
            onSubmit={handleApply}
            onCancel={() => setShowApplyModal(false)}
          />
        </Modal>
      )}

    </div>
  );
};

export default SoldierLeaves;

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { ArrowLeft, User, Shield, Calendar, MapPin, Activity, AlertCircle } from "lucide-react";

interface Soldier {
  _id: string;
  name: string;
  armyNumber: string;
  rank?: string;
  status?: string;
  unit?: string;
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
  createdAt?: string;
}

const AdminSoldierDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [soldier, setSoldier] = useState<Soldier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSoldier = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/admin/users/${id}`);

        if (res.data.success) {
          setSoldier(res.data.data);
        } else {
          setError(res.data.message || "Failed to load soldier details");
        }
      } catch (err: any) {
        setError(err.message || "Failed to establish connection to command data.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSoldier();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <User className="w-16 h-16 text-green-500 animate-pulse" />
          <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-ping"></div>
        </div>
        <p className="mt-6 text-green-400/80 font-mono tracking-[0.2em] uppercase text-sm animate-pulse">
          Loading Soldier Profile...
        </p>
      </div>
    );
  }

  if (error || !soldier) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-950/40 border border-red-900/50 rounded-2xl p-8 max-w-lg text-center backdrop-blur-sm">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white tracking-wide mb-2">Access Denied</h2>
          <p className="text-red-400/80 text-sm">{error || "Soldier not found"}</p>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="mt-6 px-6 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-100 rounded-lg transition-all border border-red-800 tracking-wide text-sm font-semibold"
          >
            Return to Command Center
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
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></span>
            <p className="text-green-500 text-xs tracking-[0.3em] uppercase font-mono">Soldier Profile</p>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">
            {soldier.name}
          </h1>
          <p className="text-gray-400 text-sm mt-1">Army ID: #{soldier.armyNumber}</p>
        </div>
      </div>

      {/* Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-bold text-white tracking-wide">Basic Information</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-widest font-medium">Full Name</p>
              <p className="text-white font-semibold">{soldier.name}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-widest font-medium">Army Number</p>
              <p className="text-white font-mono">#{soldier.armyNumber}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-widest font-medium">Rank</p>
              <p className="text-white">{soldier.rank || "Unranked"}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-widest font-medium">Unit</p>
              <p className="text-white">{soldier.unit || "Unassigned"}</p>
            </div>
          </div>
        </div>

        {/* Status & Leave */}
        <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-bold text-white tracking-wide">Current Status</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-widest font-medium mb-2">Account Status</p>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${soldier.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-600'}`}></span>
                <span className="text-white font-semibold capitalize">{soldier.status || 'Unknown'}</span>
              </div>
            </div>

            <div>
              <p className="text-gray-400 text-xs uppercase tracking-widest font-medium mb-2">Leave Status</p>
              {soldier.isOnLeave ? (
                <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold text-sm">Currently On Leave</span>
                  </div>
                  {soldier.leaveDetails && (
                    <div className="text-xs text-yellow-300/80 space-y-1">
                      <p><strong>Reason:</strong> {soldier.leaveDetails.reason}</p>
                      <p><strong>Duration:</strong> {new Date(soldier.leaveDetails.startDate).toLocaleDateString()} - {new Date(soldier.leaveDetails.endDate).toLocaleDateString()}</p>
                      <p><strong>Days:</strong> {soldier.leaveDetails.finalDays}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
                  <span className="text-green-400 font-semibold">Available for Duty</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Manager Info */}
        <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-bold text-white tracking-wide">Command Structure</h3>
          </div>
          {soldier.manager ? (
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-medium">Reporting Officer</p>
                <p className="text-white font-semibold">{soldier.manager.name}</p>
                <p className="text-gray-400 text-sm">{soldier.manager.rank}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-medium">Officer ID</p>
                <p className="text-white font-mono">#{soldier.manager.armyNumber}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-medium">Unit</p>
                <p className="text-white">{soldier.manager.unit || "N/A"}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No assigned manager</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default AdminSoldierDetail;
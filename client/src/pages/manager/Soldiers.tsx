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

// ─── Types ───────────────────────────────────────────────────────────────────

type SoldierStatus = "pending" | "active" | "on_leave" | "inactive";

const STATUS_OPTIONS: { value: SoldierStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "inactive", label: "Inactive" },
];

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Soldiers" },
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
  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
    isBusy ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
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
    <div className="space-y-6">

      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Soldiers</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and monitor all soldiers in your unit</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          {FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* pending banner */}
      {pendingCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-yellow-600 text-xl">⚠️</span>
          <p className="text-yellow-800 text-sm font-medium">
            {pendingCount} soldier{pendingCount > 1 ? "s" : ""} waiting for your approval
          </p>
        </div>
      )}

      {/* table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <div className="text-center">
            <div className="text-3xl mb-2">🪖</div>
            <p>Loading soldiers...</p>
          </div>
        </div>
      ) : !soldiers.length ? (
        <div className="flex items-center justify-center h-48 bg-white rounded-xl shadow text-gray-400">
          <div className="text-center">
            <div className="text-3xl mb-2">🪖</div>
            <p>No soldiers found</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Soldier</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Army No.</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Unit</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Duty</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Account</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {soldiers.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50 transition-colors">

                    {/* name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} isBusy={s.isBusy ?? false} />
                        <div>
                          <p className="font-medium text-gray-800">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.rank ?? "—"}</p>
                        </div>
                      </div>
                    </td>

                    {/* army number */}
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">{s.armyNumber}</td>

                    {/* unit */}
                    <td className="px-6 py-4 text-gray-600">{s.unit ?? "—"}</td>

                    {/* duty status */}
                    <td className="px-6 py-4">
                      {s.status === "active" ? (
                        s.isBusy ? (
                          <div>
                            <Badge status="active" />
                            {s.currentTask && (
                              <p className="text-xs text-gray-400 mt-1">{s.currentTask.title}</p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-xs">
                            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                            FREE
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    {/* account status */}
                    <td className="px-6 py-4"><Badge status={s.status} /></td>

                    {/* actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {s.status === "pending" ? (
                          <button
                            onClick={() => handleApprove(s._id)}
                            disabled={approvingId === s._id}
                            className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 font-medium transition-all disabled:opacity-60"
                          >
                            {approvingId === s._id ? "Approving..." : "Approve"}
                          </button>
                        ) : (
                          <select
                            value={s.status}
                            disabled={updatingId === s._id}
                            onChange={(e) => handleStatusChange(s._id, e.target.value)}
                            className="border border-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white disabled:opacity-60"
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
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Showing {soldiers.length} soldier{soldiers.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerSoldiers;
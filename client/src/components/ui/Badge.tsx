interface BadgeProps {
  status?: string;
}

const statusStyles: Record<string, string> = {
  upcoming: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
  active: "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]",
  pending_review: "bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
  approved: "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]",
  approved_by_manager: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]",
  on_leave: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  inactive: "bg-gray-800 text-gray-500 border-gray-700",
  low: "bg-green-500/10 text-green-400 border-green-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high: "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]",
};

const Badge = ({ status }: BadgeProps) => {
  const safeStatus = typeof status === "string" ? status : "unknown";
  const style = statusStyles[safeStatus] || "bg-gray-800 text-gray-300 border-gray-700";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap ${style}`}>
      {safeStatus.replace(/_/g, " ")}
    </span>
  );
};

export default Badge;
interface BadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  upcoming: "bg-yellow-100 text-yellow-800",
  active: "bg-blue-100 text-blue-800",
  pending_review: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  pending: "bg-gray-100 text-gray-800",
  on_leave: "bg-purple-100 text-purple-800",
  inactive: "bg-red-100 text-red-800",
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

const Badge = ({ status }: BadgeProps) => {
  const style = statusStyles[status] || "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${style}`}>
      {status.replace("_", " ").toUpperCase()}
    </span>
  );
};

export default Badge;
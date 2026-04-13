import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import { logout } from "../../store/slices/authSlice";
import api from "../../api/axios";

const managerLinks = [
  { to: "/manager/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/manager/soldiers", label: "Soldiers", icon: "🪖" },
  { to: "/manager/tasks", label: "Tasks", icon: "📋" },
  { to: "/manager/assignments", label: "Assignments", icon: "📌" },
];

const soldierLinks = [
  { to: "/soldier/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/soldier/tasks", label: "Available Tasks", icon: "📋" },
  { to: "/soldier/assignments", label: "My Assignments", icon: "📌" },
];

const Sidebar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((s: RootState) => s.auth);

  const links = user?.role === "manager" ? managerLinks : soldierLinks;

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err: unknown) {
      console.log("err in sidebar", err);
    } finally {
      dispatch(logout());
      navigate("/login");
    }
  };

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-white/80 backdrop-blur-sm border-r border-gray-200 shadow-sm flex flex-col z-50 transition-all duration-300">

      {/* user info - hover subtle scale */}
      <div className="p-5 border-b border-gray-100 transition-all duration-200 hover:bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0 transition-transform duration-200 hover:scale-105">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-gray-800 text-sm truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        {user?.armyNumber && (
          <p className="text-xs text-gray-400 mt-2 ml-1">#{user.armyNumber}</p>
        )}
        {user?.rank && (
          <p className="text-xs text-gray-400 ml-1">{user.rank}</p>
        )}
      </div>

      {/* nav links - dynamic hover effects */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gray-100 text-gray-900 shadow-inner"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 hover:translate-x-1 hover:shadow-sm"
              }`
            }
          >
            <span className="text-lg transition-transform duration-200 group-hover:scale-110">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* logout button - lift + colour shift */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:scale-[1.02] active:scale-95"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;
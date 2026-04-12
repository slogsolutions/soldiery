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
    } catch (err:unknown) {
        console.log("err in sidebar",err)
      // ignore error, logout anyway
    } finally {
      dispatch(logout());
      navigate("/login");
    }
  };

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-gray-900 text-white flex flex-col z-50">

      {/* user info */}
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-sm truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        {user?.armyNumber && (
          <p className="text-xs text-gray-500 mt-2 ml-1">#{user.armyNumber}</p>
        )}
        {user?.rank && (
          <p className="text-xs text-gray-500 ml-1">{user.rank}</p>
        )}
      </div>

      {/* nav links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <span className="text-base">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* logout */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-red-600 hover:text-white transition-all"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;
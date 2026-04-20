import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import type { RootState, AppDispatch } from "../../store/store";
import { logout } from "../../store/slices/authSlice";
import api from "../../api/axios";
import { LayoutDashboard, Users, Clock, ShieldAlert, LogOut, CheckSquare, UserPlus } from "lucide-react";

type Role = "admin" | "manager" | "soldier";

type MenuItem = {
  label: string;
  path: string;
  icon: any;
};

const menuConfig: Record<Exclude<Role, "soldier">, MenuItem[]> = {
  admin: [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  ],
  manager: [
    { label: "Dashboard", path: "/manager/dashboard", icon: LayoutDashboard },
    { label: "Register Soldier", path: "/manager/RegisterSoldier", icon: UserPlus },
    { label: "Soldiers", path: "/manager/soldiers", icon: Users },
    { label: "Leaves", path: "/manager/leaves", icon: Clock },
    { label: "Tasks", path: "/manager/tasks", icon: CheckSquare },
  ],
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);

  if (!user?.role) return null;
  if (user.role === "soldier") return null;

  const menuItems = menuConfig[user.role];

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      console.error(error);
      dispatch(logout());
      navigate("/login");
    }
  };

  return (
    <aside className="w-72 bg-gray-950 text-gray-300 h-screen flex flex-col border-r border-gray-800/50 shadow-2xl relative z-[60]">
      <div className="p-6 border-b border-gray-800/50 flex flex-col items-start gap-2">
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 rounded-xl bg-green-900/40 border border-green-800 flex items-center justify-center text-green-500 shadow-inner">
             <ShieldAlert size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold tracking-wide leading-none text-sm truncate">{user.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-green-400 font-mono tracking-widest uppercase bg-green-900/20 px-2 py-0.5 rounded border border-green-800/30">
                #{user.armyNumber}
              </span>
              {user.unit && (
                <span className="text-[10px] text-blue-400 font-mono tracking-widest uppercase bg-blue-900/20 px-2 py-0.5 rounded border border-blue-800/30">
                  {user.unit}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
                ${isActive 
                  ? "bg-green-900/10 text-green-400 border border-green-900/30 shadow-[inset_0_1px_0_0_rgba(74,222,128,0.1)]" 
                  : "hover:bg-gray-900/60 hover:text-white border border-transparent"
                }
              `}
            >
              <Icon size={18} className={`transition-transform duration-300 ${isActive ? "scale-110 drop-shadow-md" : "group-hover:scale-110"}`} />
              <span className={`font-semibold tracking-wide text-sm ${isActive ? "text-green-400" : ""}`}>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800/50">
        <button
           onClick={handleLogout}
           className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-400/90 hover:bg-red-950/40 hover:text-red-300 transition-all duration-300 border border-transparent hover:border-red-900/50 font-semibold tracking-wide text-sm"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
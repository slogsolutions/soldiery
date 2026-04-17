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
    <aside className="w-72 bg-gray-950 text-gray-300 h-screen flex flex-col border-r border-gray-800/50 shadow-2xl relative z-10">
      <div className="p-6 border-b border-gray-800/50 flex flex-col items-start gap-2">
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 rounded-xl bg-green-900/40 border border-green-800 flex items-center justify-center text-green-500 shadow-inner">
             <ShieldAlert size={20} />
          </div>
          <div>
            <h2 className="text-white font-bold tracking-widest leading-none text-sm uppercase">Soldierly</h2>
            <span className="text-[10px] text-green-400 font-mono tracking-widest uppercase">{user.role} PANEL</span>
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
        <div className="bg-gray-900/60 rounded-xl p-4 mb-4 border border-gray-800 backdrop-blur-sm">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Operations</span>
            <span className="text-white font-bold text-sm tracking-wide truncate">{user.name}</span>
            <span className="text-xs text-green-400/80 font-mono bg-gray-950 px-2 py-1 rounded inline-block w-fit mt-1 border border-gray-800 shadow-inner">
               #{user.armyNumber}
            </span>
          </div>
        </div>
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
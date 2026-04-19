import { LayoutDashboard, UserPlus, LogOut, Shield, Clock } from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import type { RootState } from "../../store/store";

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);

  const menu = [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Leaves", path: "/admin/leaves", icon: Clock },
    { label: "Register Manager", path: "/admin/register-manager", icon: UserPlus },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <aside className="w-72 border-r border-gray-800/60 bg-gray-950/40 backdrop-blur-xl flex flex-col relative z-20 shadow-2xl">
      <div className="p-8 pb-4 relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-green-500/20 blur-[60px] rounded-full pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-2.5 rounded-xl border border-gray-700 shadow-inner group">
            <Shield size={24} className="text-green-500 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-white leading-tight break-words">{user?.name || 'Admin'}</h2>
            <div className="flex flex-col mt-1">
              <p className="text-[10px] uppercase tracking-widest text-green-500 font-bold font-mono">#{user?.armyNumber || 'ROOT'}</p>
              <p className="text-[9px] uppercase tracking-tighter text-gray-500 font-bold mt-0.5">
                {user?.rank || 'HQ ADMIN'} {user?.unit ? `· ${user.unit}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2 mt-4">
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                isActive
                  ? "bg-gray-900/80 border border-gray-800 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-gray-900/50 border border-transparent hover:border-gray-800/50"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 shadow-[0_0_10px_#22c55e]" />
              )}
              <Icon
                size={20}
                className={`transition-colors duration-300 relative z-10 ${
                  isActive ? "text-green-400" : "group-hover:text-green-400/70"
                }`}
              />
              <span className={`font-semibold tracking-wide text-sm relative z-10 ${isActive ? "drop-shadow-sm" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto border-t border-gray-800/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-red-400/80 hover:text-white hover:bg-red-500/10 rounded-xl transition-all duration-300 border border-transparent hover:border-red-500/20 group font-bold tracking-wide text-sm"
        >
          <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          Terminate Session
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;

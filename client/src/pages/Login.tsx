import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser, setLoading, setError, clearError } from "../store/slices/authSlice";
import type { RootState } from ".././store/store";
import api from "../api/axios"
import { API_ROUTES } from "@/utils/constant";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((s: RootState) => s.auth);
  const [armyNumber, setArmyNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!armyNumber.trim() || !password.trim()) {
    dispatch(setError("Army number and password are required"));
    return;
  }

  dispatch(setLoading(true));

  try {
    // ✅ axios + API_ROUTES
    const res = await api.post(`${API_ROUTES.AUTH}/login`, {
      armyNumber: armyNumber.trim(),
      password,
    });

    // ✅ handle both cases (interceptor or normal)
    const data = res.data || res;

    if (!data.success) {
      dispatch(setError(data.message || "Login failed"));
      return;
    }

    // ✅ store user + token
    dispatch(setUser({ user: data.data, token: data.token }));

    // ✅ redirect based on role
    if (data.data.role === "admin") {
      navigate("/admin/dashboard");
    } else if (data.data.role === "manager") {
      navigate("/manager/dashboard");
    } else if (data.data.role === "soldier") {
      navigate("/soldier/dashboard");
    } else {
      dispatch(setError("Access denied: unknown role"));
    }

  } catch (err: any) {
    console.log("LOGIN ERROR:", err);
    dispatch(setError(err.message || "Network error"));
  } finally {
    dispatch(setLoading(false));
  }
};

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl flex rounded-2xl overflow-hidden border border-gray-800">

        {/* Left branding panel */}
        <div className="hidden md:flex flex-col justify-between w-80 shrink-0 bg-gray-900 border-r border-gray-800 p-10">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <span className="text-white font-bold text-lg tracking-wide">SENTINEL</span>
            </div>

            <h2 className="text-white text-2xl font-semibold leading-snug mb-3">
              Command Management System
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Secure access for authorized military personnel only. All activity is monitored and logged.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_#22c55e]" />
              Admin access
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
              Manager access
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_6px_#fb923c]" />
              Soldier access
            </div>
            <p className="text-xs text-gray-700 pt-2 border-t border-gray-800">
              Use army credentials issued by your commanding officer
            </p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 bg-gray-950 p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-sm w-full mx-auto">
            <p className="text-xs font-semibold tracking-widest text-green-500 uppercase mb-2">
              Portal Access
            </p>
            <h1 className="text-2xl font-bold text-white mb-1">Sign in</h1>
            <p className="text-gray-500 text-sm mb-8">Use your army credentials to continue</p>

            {error && (
              <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-lg px-4 py-3 mb-6">
                <svg className="w-4 h-4 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2" htmlFor="armyNum">
                  Army Number
                </label>
                <input
                  id="armyNum"
                  type="text"
                  placeholder="e.g. IC-204587"
                  value={armyNumber}
                  onChange={(e) => { setArmyNumber(e.target.value); dispatch(clearError()); }}
                  autoComplete="username"
                  spellCheck={false}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2" htmlFor="pass">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="pass"
                    type={showPass ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); dispatch(clearError()); }}
                    autoComplete="current-password"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 pr-12 text-white text-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                    aria-label="Toggle password visibility"
                  >
                    {showPass ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <>
                    Authenticate
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-gray-700 text-center mt-8 leading-relaxed">
              Credentials are assigned by your commanding officer.
              <br />Contact your manager or admin if locked out.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
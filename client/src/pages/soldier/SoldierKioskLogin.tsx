import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser, setLoading, setError, clearError } from "../../store/slices/authSlice";
import type { RootState } from "../../store/store";

// Numpad PIN-style kiosk login for soldiers
// Army number typed normally, password via big numpad buttons

export default function SoldierKioskLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((s: RootState) => s.auth);

  const [step, setStep] = useState<"armyNumber" | "password">("armyNumber");
  const [armyNumber, setArmyNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!armyNumber.trim() || !password.trim()) {
      dispatch(setError("Army number and password are required"));
      return;
    }
    dispatch(setLoading(true));
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ armyNumber: armyNumber.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        dispatch(setError(data.message ?? "Login failed"));
        setPassword("");
        setStep("armyNumber");
        return;
      }
      if (data.data.role !== "soldier") {
        dispatch(setError("This terminal is for soldiers only"));
        setPassword("");
        setStep("armyNumber");
        return;
      }
      dispatch(setUser({ user: data.data, token: data.token }));
      navigate("/soldier/kiosk");
    } catch {
      dispatch(setError("Connection error. Try again."));
    }
  };

  const handleNext = () => {
    if (!armyNumber.trim()) {
      dispatch(setError("Enter your army number first"));
      return;
    }
    dispatch(clearError());
    setStep("password");
  };

  const handleReset = () => {
    setArmyNumber("");
    setPassword("");
    setStep("armyNumber");
    dispatch(clearError());
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 select-none">

      {/* Header bar */}
      <div className="w-full max-w-sm mb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-wider">SENTINEL</span>
        </div>
        <p className="text-gray-600 text-sm">Soldier Kiosk Terminal</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

        {/* Step indicator */}
        <div className="flex border-b border-gray-800">
          <div className={`flex-1 py-3 text-center text-xs font-semibold tracking-wider transition-colors ${step === "armyNumber" ? "text-green-400 bg-green-950/40" : "text-gray-600"}`}>
            1. ARMY NUMBER
          </div>
          <div className={`flex-1 py-3 text-center text-xs font-semibold tracking-wider transition-colors ${step === "password" ? "text-green-400 bg-green-950/40" : "text-gray-600"}`}>
            2. PASSWORD
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-xl px-4 py-3 mb-5">
              <svg className="w-4 h-4 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {step === "armyNumber" ? (
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Enter Army Number
              </label>
              <input
                type="text"
                value={armyNumber}
                onChange={(e) => { setArmyNumber(e.target.value.toUpperCase()); dispatch(clearError()); }}
                placeholder="e.g. 14789563X"
                autoFocus
                spellCheck={false}
                autoComplete="off"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-4 text-white text-xl font-mono text-center tracking-widest placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 transition"
              />
              <button
                onClick={handleNext}
                className="w-full mt-5 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-bold text-lg py-4 rounded-xl transition-all"
              >
                Next →
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Enter Password
                </label>
                <button
                  onClick={() => setShowPass((v) => !v)}
                  className="text-xs text-gray-500 hover:text-gray-300 transition"
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>

              {/* Display */}
              <div className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-4 text-white text-2xl font-mono text-center tracking-widest min-h-[64px] flex items-center justify-center mb-5">
                {password.length === 0 ? (
                  <span className="text-gray-700 text-base">tap keys below</span>
                ) : showPass ? (
                  password
                ) : (
                  "●".repeat(password.length)
                )}
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {["1","2","3","4","5","6","7","8","9"].map((k) => (
                  <button
                    key={k}
                    onClick={() => { setPassword((p) => p + k); dispatch(clearError()); }}
                    className="bg-gray-800 hover:bg-gray-700 active:scale-95 active:bg-gray-600 text-white text-2xl font-semibold py-5 rounded-xl transition-all"
                  >
                    {k}
                  </button>
                ))}
                {/* Bottom row: clear, 0, backspace */}
                <button
                  onClick={() => setPassword("")}
                  className="bg-gray-800 hover:bg-red-900/60 active:scale-95 text-gray-400 hover:text-red-300 text-sm font-semibold py-5 rounded-xl transition-all"
                >
                  CLR
                </button>
                <button
                  onClick={() => { setPassword((p) => p + "0"); dispatch(clearError()); }}
                  className="bg-gray-800 hover:bg-gray-700 active:scale-95 active:bg-gray-600 text-white text-2xl font-semibold py-5 rounded-xl transition-all"
                >
                  0
                </button>
                <button
                  onClick={() => setPassword((p) => p.slice(0, -1))}
                  className="bg-gray-800 hover:bg-gray-700 active:scale-95 text-gray-300 text-xl py-5 rounded-xl transition-all flex items-center justify-center"
                >
                  ⌫
                </button>
              </div>

              {/* Also allow typing for non-numeric passwords */}
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); dispatch(clearError()); }}
                placeholder="or type here"
                className="w-full bg-transparent border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm font-mono text-center placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-green-700 transition mb-5"
              />

              <button
                onClick={handleLogin}
                disabled={isLoading || password.length === 0}
                className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white font-bold text-lg py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : "Login"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 px-6 py-3 flex items-center justify-between">
          <button onClick={handleReset} className="text-xs text-gray-600 hover:text-gray-400 transition">
            ← Start over
          </button>
          {step === "password" && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />
              <p className="text-xs text-gray-600 font-mono">{armyNumber}</p>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-700 mt-8 text-center">
        For access issues, contact your commanding officer.
      </p>
    </div>
  );
}
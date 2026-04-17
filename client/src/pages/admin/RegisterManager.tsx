import { useState } from "react";
import api from "../../api/axios";

const RANKS = [
  "Lieutenant", "Captain", "Major", "Lieutenant Colonel",
  "Colonel", "Brigadier", "Major General", "Lieutenant General", "General",
];

interface FormState {
  name: string;
  armyNumber: string;
  password: string;
  rank: string;
  unit: string;
}

const EMPTY: FormState = { name: "", armyNumber: "", password: "", rank: "", unit: "" };

export default function RegisterManager() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ name: string; armyNumber: string; password: string } | null>(null);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setError(null);
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!";
    const pass = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setForm((f) => ({ ...f, password: pass }));
    setShowPass(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.armyNumber.trim() || !form.password.trim()) {
      setError("Name, army number and password are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/api/admin/managers", form);
      const data = res.data;
      if (!data.success) {
        setError(data.message ?? "Failed to create manager");
        return;
      }
      setSuccess({ name: form.name, armyNumber: form.armyNumber, password: form.password });
      setForm(EMPTY);
    } catch (err: any) {
      setError(err.response?.data?.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <span className="text-xs font-semibold tracking-widest text-green-500 uppercase">Admin Panel</span>
          <h1 className="text-2xl font-bold text-white mt-1">Register Manager</h1>
          <p className="text-gray-500 text-sm mt-1">Create a new manager account and share credentials manually.</p>
        </div>

        {success && (
          <div className="bg-green-950 border border-green-800 rounded-xl p-4 mb-6 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-green-300 font-semibold text-sm">Manager registered — {success.name}</p>
              <p className="text-green-600 text-xs mt-1">Army No: <span className="text-green-400 font-mono">{success.armyNumber}</span></p>
              <p className="text-green-600 text-xs">Password: <span className="text-green-400 font-mono">{success.password}</span></p>
              <p className="text-green-700 text-xs mt-1">Share these credentials securely.</p>
            </div>
            <button onClick={() => setSuccess(null)} className="text-green-700 hover:text-green-400 text-lg leading-none">×</button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-xl px-4 py-3 mb-6">
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-5">Personal Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Full Name <span className="text-green-500">*</span>
                </label>
                <input type="text" placeholder="e.g. Col. Arjun Singh" value={form.name} onChange={set("name")}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 transition" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Army Number <span className="text-green-500">*</span>
                </label>
                <input type="text" placeholder="e.g. IC-204587" value={form.armyNumber} onChange={set("armyNumber")} spellCheck={false}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 transition" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Rank</label>
                <select value={form.rank} onChange={set("rank")}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-600 transition">
                  <option value="">Select rank</option>
                  {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Unit / Battalion</label>
                <input type="text" placeholder="e.g. 21 Rajput Regiment" value={form.unit} onChange={set("unit")}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 transition" />
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-gray-800">
            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-5">Login Credentials</p>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Password <span className="text-green-500">*</span>
              </label>
              <button type="button" onClick={generatePassword} className="text-xs text-green-500 hover:text-green-400 underline underline-offset-2 transition">
                Generate strong password
              </button>
            </div>
            <div className="relative">
              <input type={showPass ? "text" : "password"} placeholder="Set a password" value={form.password} onChange={set("password")}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 pr-20 text-white text-sm font-mono placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 transition" />
              <button type="button" onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-300 transition px-2 py-1">
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">Min 8 characters. Share with the manager manually.</p>
          </div>

          <div className="px-6 py-4 flex items-center justify-end gap-3">
            <button type="button" onClick={() => { setForm(EMPTY); setError(null); }}
              className="px-5 py-2.5 rounded-xl text-sm text-gray-400 border border-gray-800 hover:border-gray-700 hover:text-gray-200 transition">
              Clear
            </button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition">
              {loading ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>Register Manager</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
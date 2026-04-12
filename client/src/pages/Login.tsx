import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import api from "../api/axios";
import { setAuth } from "../store/slices/authSlice";
import type { AppDispatch } from "../store/store";
import { API_ROUTES } from "@/utils/constant";

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    role: "manager" | "soldier";
    armyNumber: string;
    rank?: string;
    unit?: string;
    status: string;
  };
}

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [form, setForm] = useState({ armyNumber: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post<LoginResponse>(
        `${API_ROUTES.AUTH}/login`,
        form,
      );

      const { data } = res.data;

      // save user + token (cookie is set inside setAuth)
      dispatch(setAuth(data)); // token cookie already set by backend

      // redirect based on role
      navigate(
        data.role === "manager" ? "/manager/dashboard" : "/soldier/dashboard",
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🪖</div>
          <h1 className="text-3xl font-bold text-white">Army Task System</h1>
          <p className="text-gray-400 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Army Number
              </label>
              <input
                type="text"
                name="armyNumber"
                value={form.armyNumber}
                onChange={handleChange}
                required
                placeholder="e.g. JC-12345"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            New soldier?{" "}
            <Link
              to="/register"
              className="text-green-600 font-medium hover:underline"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

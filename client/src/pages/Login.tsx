import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

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
  token: string;
}

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    armyNumber: "",
    password: "",
  });

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
      const res = await api.post<LoginResponse>("/api/auth/login", form);

      const { data, token } = res.data;

      // store in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(data));

      // redirect based on role
      if (data.role === "manager") {
        navigate("/manager/dashboard");
      } else {
        navigate("/soldier/dashboard");
      }
    } catch (err: unknown) {
      console.error("Login error:", err);

      let errorMessage = "Login failed";

      if (err && typeof err === "object") {
        const error = err as {
          response?: {
            data?: { message?: string };
          };
          message?: string;
        };

        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🪖</div>
          <h1 className="text-3xl font-bold text-white">Army Task System</h1>
          <p className="text-gray-400 mt-2">Sign in to your account</p>
        </div>

        {/* card */}
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

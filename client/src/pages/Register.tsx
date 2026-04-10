import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { API_ROUTES } from "@/utils/constant";

// Type for form data
interface RegisterForm {
  name: string;
  armyNumber: string;
  password: string;
  rank: string;
  unit: string;
}

// Type for backend error response (based on your API)
interface ErrorResponse {
  success: false;
  message: string;
}

// Type for successful registration response
interface RegisterSuccessResponse {
  success: true;
  message: string;
  data: {
    _id: string;
    name: string;
    armyNumber: string;
    rank?: string;
    unit?: string;
    role: "soldier";
    status: "pending";
  };
}

// Axios error shape (from your interceptor or network)
interface AxiosError {
  response?: {
    data?: ErrorResponse | { message?: string };
    status?: number;
  };
  message?: string;
}

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  const [form, setForm] = useState<RegisterForm>({
    name: "",
    armyNumber: "",
    password: "",
    rank: "",
    unit: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Prepare payload – omit empty optional fields
      const payload = {
        name: form.name,
        armyNumber: form.armyNumber,
        password: form.password,
        ...(form.rank && { rank: form.rank }),
        ...(form.unit && { unit: form.unit }),
      };

      const response = await api.post<RegisterSuccessResponse>(
        `${API_ROUTES.AUTH}/register`,
        payload,
      );

      if (response.data.success) {
        setSuccess(true);
      } else {
        // This branch should not happen on 201, but TypeScript requires handling
        setError("Registration failed");
      }
    } catch (err: unknown) {
      console.error("Registration error:", err);

      // Type-safe error extraction
      let errorMessage = "Something went wrong";

      if (err && typeof err === "object") {
        const axiosError = err as AxiosError;

        if (axiosError.response?.data) {
          const data = axiosError.response.data;
          // Check for message in different possible formats
          if ("message" in data && typeof data.message === "string") {
            errorMessage = data.message;
          } else if ("message" in data && data.message) {
            errorMessage = data.message;
          }
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Registration Successful!
          </h2>
          <p className="text-gray-500 mb-6">
            Your account is pending approval from the manager. Please wait for
            approval before logging in.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🪖</div>
          <h1 className="text-3xl font-bold text-white">
            Soldier Registration
          </h1>
          <p className="text-gray-400 mt-2">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Sgt. Rajesh Kumar"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Army Number *
              </label>
              <input
                type="text"
                name="armyNumber"
                value={form.armyNumber}
                onChange={handleChange}
                placeholder="e.g. IC-12345"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rank
                </label>
                <input
                  type="text"
                  name="rank"
                  value={form.rank}
                  onChange={handleChange}
                  placeholder="e.g. Sepoy"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  placeholder="e.g. Alpha"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-60 mt-2"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-green-600 font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

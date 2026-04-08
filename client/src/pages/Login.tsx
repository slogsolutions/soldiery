import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addUser } from "@/features/user/userSlice";
import axiosInstance from "@/utils/axios.config";

const Login = () => {
  const [emailId, setEmailId] = useState("Batman12@gmail.com");
  const [password, setPassword] = useState("Batmanwar@12");
  const [error, setError] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      setError("");
      const userData = await axiosInstance.post("/login", {
        emailId,
        password,
      });

      dispatch(addUser(userData.data));
      navigate("/");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Login Failed");
        console.log("Unexpected error type : ", error);
      }
    }
  };

  return (
    <div className="min-h-screen flex  justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white h-full mt-12 border-1 border-black p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="mb-5">
          <h1 className="text-2xl  text-slate-800 text-center">
            Connect with devlopers like you!
          </h1>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <div className="mb-5">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                value={emailId}
                onChange={(e) => setEmailId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-700 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-700 transition-colors"
              />
            </div>
          </div>
          {error && (
            <p className="text-slate-800 text-lg  mb-4 text-center">{error}</p>
          )}
          <div className="mt-5 p-2">
            <button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Login
            </button>
          </div>

          
        <div className="text-center mt-6">
          <p className="text-gray-600">
            don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/Signup")}
              className="text-slate-900 cursor-pointer hover:text-slate-950 font-medium"
            >
              Signup
            </button>
          </p>
        </div>
          
        </form>
      </div>
    </div>
  );
};

export default Login;

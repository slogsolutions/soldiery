import { useEffect } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./store/store";
import api from "./api/axios";
import { setAuth, logout } from "./store/slices/authSlice";

// auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// layout
import ProtectedRoute from "./components/Layout/Protectedroute";
import Layout from "./components/Layout/Layout";

// manager pages
import ManagerDashboard from "./pages/manager/Dashboard";
import ManagerSoldiers from "./pages/manager/Soldiers";
import ManagerTasks from "./pages/manager/Tasks";
import ManagerAssignments from "./pages/manager/Assignments";

// soldier pages
import SoldierDashboard from "./pages/soldier/Dashboard";
import SoldierTasks from "./pages/soldier/Tasks";
import SoldierAssignments from "./pages/soldier/Assignments";

// ─── Router ────────────────────────────────────────────────────────────────

const router = createBrowserRouter([

  // ── public routes ──────────────────────────────────────────────────────
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },

  // ── default redirect ───────────────────────────────────────────────────
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },

  // ── manager routes ─────────────────────────────────────────────────────
  {
    path: "/manager/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["manager"]}>
        <Layout>
          <ManagerDashboard />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/soldiers",
    element: (
      <ProtectedRoute allowedRoles={["manager"]}>
        <Layout>
          <ManagerSoldiers />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/tasks",
    element: (
      <ProtectedRoute allowedRoles={["manager"]}>
        <Layout>
          <ManagerTasks />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/assignments",
    element: (
      <ProtectedRoute allowedRoles={["manager"]}>
        <Layout>
          <ManagerAssignments />
        </Layout>
      </ProtectedRoute>
    ),
  },

  // ── soldier routes ─────────────────────────────────────────────────────
  {
    path: "/soldier/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["soldier"]}>
        <Layout>
          <SoldierDashboard />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/soldier/tasks",
    element: (
      <ProtectedRoute allowedRoles={["soldier"]}>
        <Layout>
          <SoldierTasks />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/soldier/assignments",
    element: (
      <ProtectedRoute allowedRoles={["soldier"]}>
        <Layout>
          <SoldierAssignments />
        </Layout>
      </ProtectedRoute>
    ),
  },

  // ── 404 catch all ──────────────────────────────────────────────────────
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

// ─── App ───────────────────────────────────────────────────────────────────

const App = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    // verify cookie on every page load and rehydrate user
    api
      .get("/auth/me")
      .then((res) => dispatch(setAuth(res.data.data)))
      .catch(() => dispatch(logout()));
  }, [dispatch]);

  // wait for /auth/me to finish before rendering any route
  // prevents flash of wrong page on refresh
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🪖</div>
          <p className="text-white text-lg font-medium">Loading...</p>
          <p className="text-gray-400 text-sm mt-1">Verifying your session</p>
        </div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
};

export default App;
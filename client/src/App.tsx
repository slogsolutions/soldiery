import { useEffect, useState } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./store/store";
import api from "./api/axios";
import { setUser, logout } from "./store/slices/authSlice";

// auth pages
import Login from "./pages/Login";

// layout
import ProtectedRoute from "./components/Layout/Protectedroute";
import Layout from "./components/Layout/Layout";
import AdminLayout from "./components/Layout/AdminLayout";

//admin pages
import AdminDashboard from "./pages/admin/AdminDashboard"
import RegisterManager from "./pages/admin/RegisterManager";
import SoldierDetail from "./pages/admin/SoldierDetail";
import AssignTask from "./pages/admin/AssignTask";

// manager pages
import ManagerDashboard from "./pages/manager/Dashboard";
import ManagerSoldiers from "./pages/manager/Soldiers";
import ManagerTasks from "./pages/manager/Tasks";
import ManagerLeaves from "./pages/manager/Leave";
import RegisterSoldier from "./pages/manager/RegisterSoldier";

// soldier pages
import SoldierDashboard from "./pages/soldier/Dashboard";

// admin pages
import AdminLeaves from "./pages/admin/Leaves";

// ─── Router ────────────────────────────────────────────────────────────────

const router = createBrowserRouter([

  // ── public routes ──────────────────────────────────────────────────────
  {
    path: "/login",
    element: <Login />,
  },

  // ── default redirect ───────────────────────────────────────────────────
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },

  // ── admin routes ───────────────────────────────────────────────────────
  {
    path: "/admin/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    // Admin registers a new manager
    path: "/admin/register-manager",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLayout>
          <RegisterManager />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    // Admin views a specific manager's dashboard
    path: "/admin/manager/:id",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLayout>
          <ManagerDashboard />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    // Admin views a specific soldier's profile
    path: "/admin/soldier/:id",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLayout>
          <SoldierDetail />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    // Admin assigns a task to a soldier
    path: "/admin/assign-task/:id",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLayout>
          <AssignTask />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/leaves",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLayout>
          <AdminLeaves />
        </AdminLayout>
      </ProtectedRoute>
    ),
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
    path: "/manager/RegisterSoldier",
    element: (
      <ProtectedRoute allowedRoles={["manager"]}>
        <Layout>
          <RegisterSoldier />
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
    path: "/manager/assign-task/:id",
    element: (
      <ProtectedRoute allowedRoles={["manager"]}>
        <Layout>
          <AssignTask />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/assignments",
    element: <Navigate to="/manager/tasks" replace />,
  },
  {
    path: "/manager/leaves",
    element: (
      <ProtectedRoute allowedRoles={["manager"]}>
        <Layout>
          <ManagerLeaves />
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
  // Legacy redirects — everything lives on the dashboard now
  { path: "/soldier/tasks", element: <Navigate to="/soldier/dashboard" replace /> },
  { path: "/soldier/assignments", element: <Navigate to="/soldier/dashboard" replace /> },
  { path: "/soldier/leaves", element: <Navigate to="/soldier/dashboard" replace /> },

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

  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (checked) return;

    api.get("/api/auth/me")
      .then((res) => {
        const token = localStorage.getItem("token") || "";
        dispatch(setUser({ user: res.data.data, token }));
      })
      .catch((err: any) => {
        if (err.response?.status === 401) {
          dispatch(logout());
        }
      })
      .finally(() => setChecked(true));
  }, [checked]);

  // prevents flash of wrong page on refresh
  if (isLoading || !checked) {
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
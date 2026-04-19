import { Router } from "express";
import { protect, restrictTo } from "../middlewares/auth";

import {
  createManager,
  getAllManagers,
  getAllSoldiers,
  getUser,
  editUser,
  deleteUser,

  // leave
  getAdminLeaves,
  adminApproveLeave,
  adminRejectLeave,

  // manager mirroring
  getManagerOverviewDashboard,
  getManagerOverviewSoldiers,
  getManagerOverviewLeaves,

  // tasks
  getAdminTasks,
  getAdminDashboard,

  // assignments
  createAdminAssignment,
} from "../controllers/admin";

const router = Router();

//  all admin routes protected
router.use(protect, restrictTo("admin"));

// ─────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────
router.post("/managers", createManager);

router.get("/managers", getAllManagers);
router.get("/dashboard", getAdminDashboard);

router.get("/soldiers", getAllSoldiers);

router.get("/users/:id", getUser);

router.patch("/users/:id", editUser);
router.delete("/users/:id", deleteUser);

// ─────────────────────────────
// LEAVE MANAGEMENT
// ─────────────────────────────
router.get("/leaves", getAdminLeaves);

router.patch("/leaves/:id/approve", adminApproveLeave);

router.patch("/leaves/:id/reject", adminRejectLeave);

// ─────────────────────────────
// TASK MANAGEMENT
// ─────────────────────────────
router.get("/tasks", getAdminTasks);

// ─────────────────────────────
// ASSIGNMENT MANAGEMENT
// ─────────────────────────────
router.post("/assignments", createAdminAssignment);

// ─────────────────────────────
// MANAGER OVERVIEW DASHBOARD
// ─────────────────────────────
router.get("/managers/:id/dashboard", getManagerOverviewDashboard);
router.get("/managers/:id/soldiers", getManagerOverviewSoldiers);
router.get("/managers/:id/leaves", getManagerOverviewLeaves);

export default router;
import { Router } from "express";
import { protect, restrictTo } from "../middlewares/auth";
import {
  getAllSoldiers,
  getSoldierById,
  approveSoldier,
  updateSoldierStatus,
  createTask,
  getAllTasks,
  updateTask,
  deleteTask,
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  approveAssignment,
  rejectAssignment,
  getDashboard,
} from "../controllers/manager";

const router = Router();

// all manager routes require login + manager role
router.use(protect, restrictTo("manager"));

// dashboard
router.get("/dashboard", getDashboard);

// soldier management
router.get("/soldiers", getAllSoldiers);
router.get("/soldiers/:id", getSoldierById);
router.patch("/soldiers/:id/approve", approveSoldier);
router.patch("/soldiers/:id/status", updateSoldierStatus);

// task management
router.post("/tasks", createTask);
router.get("/tasks", getAllTasks);
router.patch("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);

// assignment management
router.post("/assignments", createAssignment);
router.get("/assignments", getAllAssignments);
router.get("/assignments/:id", getAssignmentById);
router.patch("/assignments/:id", updateAssignment);
router.patch("/assignments/:id/approve", approveAssignment);
router.patch("/assignments/:id/reject", rejectAssignment);

export default router;
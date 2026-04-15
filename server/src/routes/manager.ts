import { Router } from "express";
import { protect, restrictTo } from "../middlewares/auth";
import {
  createSoldier,
  getAllSoldiers,
  getSoldierById,

  createTask,
  getAllTasks,
  updateTask,
  deleteTask,

  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,

  getDashboard,

  // leave
  getManagerLeaves,
  approveLeaveByManager,
  rejectLeaveByManager,
  editLeaveByManager,
  sendLeaveToAdmin,
} from "../controllers/manager";

const router = Router();

// all manager routes require login + manager role
router.use(protect, restrictTo("manager"));

// dashboard
router.get("/dashboard", getDashboard);

// soldier management
router.post("/soldiers",createSoldier)
router.get("/soldiers", getAllSoldiers);
router.get("/soldiers/:id", getSoldierById);

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

//leave management
router.get("/leaves", getManagerLeaves);
router.patch("/leaves/:id/edit", editLeaveByManager);
router.patch("/leaves/:id/approve", approveLeaveByManager);
router.patch("/leaves/:id/reject", rejectLeaveByManager);
router.patch("/leaves/:id/send-to-admin", sendLeaveToAdmin);

export default router;
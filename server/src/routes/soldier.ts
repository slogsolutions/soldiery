import { Router } from "express";
import { protect, restrictTo } from "../middlewares/auth";
import {
  getAvailableTasks,
  getMyAssignments,
  selfAssign,
  markAsDone,
} from "../controllers/soldier";

const router = Router();

// all soldier routes require login + soldier role
router.use(protect, restrictTo("soldier"));

router.get("/tasks", getAvailableTasks);
router.get("/assignments", getMyAssignments);
router.post("/assignments", selfAssign);
router.patch("/assignments/:id/done", markAsDone);

export default router;
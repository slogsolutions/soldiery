import { Router } from "express";
import { protect, restrictTo } from "../middlewares/auth";
import {
  getMyAssignments, 
} from "../controllers/soldier";

const router = Router();

// all soldier routes require login + soldier role
router.use(protect, restrictTo("soldier"));

router.get("/assignments", getMyAssignments);

export default router;
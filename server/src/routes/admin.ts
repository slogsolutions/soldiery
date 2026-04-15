import { Router } from "express";
import { protect, restrictTo } from "../middlewares/auth";

import {
  createManager,
  getAllManagers,
  getAllSoldiers,
  getUser,
  editUser,

  // leave
  getAdminLeaves,
  adminApproveLeave,
  adminRejectLeave,
} from "../controllers/admin";

const router = Router();

//  all admin routes protected
router.use(protect, restrictTo("admin"));

// ─────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────
router.post("/managers", createManager);

router.get("/managers", getAllManagers);

router.get("/soldiers", getAllSoldiers);

router.get("/users/:id", getUser);

router.patch("/users/:id", editUser);

// ─────────────────────────────
// LEAVE MANAGEMENT
// ─────────────────────────────
router.get("/leaves", getAdminLeaves);

router.patch("/leaves/:id/approve", adminApproveLeave);

router.patch("/leaves/:id/reject", adminRejectLeave);

export default router;
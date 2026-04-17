import { Router } from "express";
import { protect, restrictTo } from "../middlewares/auth";

import {
  applyLeave,
  getMyLeaves,

  getManagerLeaves,
  approveLeaveByManager,
  rejectLeaveByManager,
  sendLeaveToAdmin,
  editLeaveByManager,

  getAdminLeaves,
  adminApproveLeave,
  adminEditLeave,
  adminRejectLeave,
} from "../controllers/leave";

const router = Router();

// ─────────────────────────────────────────
// SOLDIER ROUTES
// ─────────────────────────────────────────
const soldierRouter = Router();

soldierRouter.use(protect, restrictTo("soldier"));

soldierRouter.post("/leaves", applyLeave);
soldierRouter.get("/leaves", getMyLeaves);

// ─────────────────────────────────────────
// MANAGER ROUTES
// ─────────────────────────────────────────
const managerRouter = Router();

managerRouter.use(protect, restrictTo("manager"));

managerRouter.get("/leaves", getManagerLeaves);
managerRouter.patch("/leaves/:id/approve", approveLeaveByManager);
managerRouter.patch("/leaves/:id/reject", rejectLeaveByManager);
managerRouter.patch("/leaves/:id/edit", editLeaveByManager);
managerRouter.patch("/leaves/:id/send-to-admin", sendLeaveToAdmin);

// ─────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────
const adminRouter = Router();

adminRouter.use(protect, restrictTo("admin"));

adminRouter.get("/leaves", getAdminLeaves);
adminRouter.patch("/leaves/:id/edit", adminEditLeave);
adminRouter.patch("/leaves/:id/approve", adminApproveLeave);
adminRouter.patch("/leaves/:id/reject", adminRejectLeave);

// ─────────────────────────────────────────
// MOUNT ROUTES
// ─────────────────────────────────────────
router.use("/soldier", soldierRouter);
router.use("/manager", managerRouter);
router.use("/admin", adminRouter);

export default router;
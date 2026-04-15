import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { Leave } from "../models/Leave";

// ─────────────────────────────────────────
// Helper
// ─────────────────────────────────────────
const calcDays = (start: Date, end: Date): number =>
  Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

// ─────────────────────────────────────────
// SOLDIER
// ─────────────────────────────────────────

// Apply Leave
export const applyLeave = async (req: AuthRequest, res: Response) => {
  try {
    const { reason, startDate, endDate } = req.body;

    if (!reason || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "reason, startDate and endDate are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "endDate must be after startDate",
      });
    }

    const days = calcDays(start, end);

    const leave = await Leave.create({
      soldier: req.user!.id,
      manager: req.user!.manager, // 🔥 important
      reason,
      startDate: start,
      endDate: end,
      originalDays: days,
      finalDays: days,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Leave applied successfully",
      data: leave,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get My Leaves
export const getMyLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const leaves = await Leave.find({
      soldier: req.user!.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: leaves });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────
// MANAGER
// ─────────────────────────────────────────

// Get Manager Leaves
export const getManagerLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const leaves = await Leave.find({
      manager: req.user!.id,
    })
      .populate("soldier", "name rank armyNumber")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: leaves });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Approve (FINAL by manager)
export const approveLeaveByManager = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const leave = await Leave.findOne({
      _id: req.params.id,
      manager: req.user!.id,
    });

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        message: "Only pending leaves can be approved",
      });
    }

    leave.status = "approved";
    leave.managerId = req.user!.id;

    await leave.save();

    res.status(200).json({
      success: true,
      message: "Leave approved by manager",
      data: leave,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Reject
export const rejectLeaveByManager = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { managerNote } = req.body;

    const leave = await Leave.findOne({
      _id: req.params.id,
      manager: req.user!.id,
    });

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        message: "Only pending leaves can be rejected",
      });
    }

    leave.status = "rejected";
    leave.managerId = req.user!.id;

    if (managerNote) {
      leave.managerNote = managerNote;
    }

    await leave.save();

    res.status(200).json({
      success: true,
      message: "Leave rejected by manager",
      data: leave,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Send to Admin
export const sendLeaveToAdmin = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const leave = await Leave.findOne({
      _id: req.params.id,
      manager: req.user!.id,
    });

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        message: "Only pending leaves can be sent to admin",
      });
    }

    leave.status = "approved_by_manager";
    leave.managerId = req.user!.id;

    await leave.save();

    res.status(200).json({
      success: true,
      message: "Leave sent to admin",
      data: leave,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Edit Leave
export const editLeaveByManager = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { finalDays, managerNote } = req.body;

    const leave = await Leave.findOne({
      _id: req.params.id,
      manager: req.user!.id,
    });

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        message: "Only pending leaves can be edited",
      });
    }

    if (finalDays !== undefined) {
      if (finalDays <= 0) {
        return res.status(400).json({
          message: "finalDays must be greater than 0",
        });
      }
      leave.finalDays = finalDays;
    }

    if (managerNote !== undefined) {
      leave.managerNote = managerNote;
    }

    await leave.save();

    res.status(200).json({
      success: true,
      message: "Leave updated",
      data: leave,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────

// Get leaves sent to admin
export const getAdminLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const leaves = await Leave.find({
      status: "approved_by_manager",
    })
      .populate("soldier", "name rank armyNumber")
      .populate("managerId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: leaves });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Final Approve (admin)
export const adminApproveLeave = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.status !== "approved_by_manager") {
      return res.status(400).json({
        message: "Leave is not pending admin approval",
      });
    }

    leave.status = "approved";
    leave.adminId = req.user!.id;

    await leave.save();

    res.status(200).json({
      success: true,
      message: "Leave approved by admin",
      data: leave,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Final Reject (admin)
export const adminRejectLeave = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { adminNote } = req.body;

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.status !== "approved_by_manager") {
      return res.status(400).json({
        message: "Leave is not pending admin review",
      });
    }

    leave.status = "rejected";
    leave.adminId = req.user!.id;

    if (adminNote) {
      leave.adminNote = adminNote;
    }

    await leave.save();

    res.status(200).json({
      success: true,
      message: "Leave rejected by admin",
      data: leave,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
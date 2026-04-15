import { Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Leave } from "../models/Leave";
import { AuthRequest } from "../middlewares/auth";

// ─── Create manager ────────────────────────────────────────────────────────
export const createManager = async (req: AuthRequest, res: Response) => {
  try {
    const { name, password, armyNumber, rank, unit } = req.body;

    if (!name || !password || !armyNumber) {
      return res.status(400).json({
        success: false,
        message: "Name, password and army number are required",
      });
    }

    const existing = await User.findOne({ armyNumber });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Army number already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const manager = await User.create({
      name,
      password: hashedPassword,
      armyNumber,
      rank,
      unit,
      role: "manager",
      status: "active",
    });

    const data = await User.findById(manager._id).select("-password");

    res.status(201).json({
      success: true,
      message: "Manager created successfully",
      data,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get all managers ──────────────────────────────────────────────────────
export const getAllManagers = async (req: AuthRequest, res: Response) => {
  try {
    const managers = await User.find({ role: "manager" }).select("-password");

    res.status(200).json({
      success: true,
      count: managers.length,
      data: managers,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get all soldiers ──────────────────────────────────────────────────────
export const getAllSoldiers = async (req: AuthRequest, res: Response) => {
  try {
    const soldiers = await User.find({ role: "soldier" })
      .select("-password")
      .populate("manager", "name rank unit armyNumber");

    res.status(200).json({
      success: true,
      count: soldiers.length,
      data: soldiers,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get single user ───────────────────────────────────────────────────────
export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("manager", "name rank unit armyNumber");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot access admin accounts",
      });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Edit user ─────────────────────────────────────────────────────────────
export const editUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot edit admin accounts",
      });
    }

    const allowedFields = ["name", "rank", "unit", "status", "manager"] as const;

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (user as any)[field] = req.body[field];
      }
    });

    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    await user.save();

    const updated = await User.findById(user._id)
      .select("-password")
      .populate("manager", "name rank unit armyNumber");

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────
// ADMIN LEAVE FLOW 
// ─────────────────────────────────────────

// Get leaves sent to admin
export const getAdminLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const leaves = await Leave.find({
      status: "approved_by_manager",
    })
      .populate("soldier", "name rank armyNumber unit")
      .populate("manager", "name rank armyNumber")
      .populate("managerId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin approve leave
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

// Admin reject leave
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
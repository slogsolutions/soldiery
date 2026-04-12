import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { User } from "../models/User";
import { Assignment } from "../models/Assignment";

// GET /api/manager/soldiers
export const getAllSoldiers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: any = { role: "soldier" };
    if (status) filter.status = status;

    const soldiers = await User.find(filter).select("-password");

    const now = new Date();

    // attach free/busy status to each soldier
    const soldiersWithStatus = await Promise.all(
      soldiers.map(async (soldier) => {
        const activeAssignment = await Assignment.findOne({
          soldier: soldier._id,
          startTime: { $lte: now },
          endTime: { $gte: now },
          status: { $in: ["active", "pending_review"] },
        }).populate("task", "title");

        return {
          ...soldier.toJSON(),
          isBusy: !!activeAssignment,
          currentTask: activeAssignment?.task || null,
        };
      })
    );

    res.status(200).json({ success: true, data: soldiersWithStatus });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/manager/soldiers/:id
export const getSoldierById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const soldier = await User.findOne({
      _id: req.params.id,
      role: "soldier",
    }).select("-password");

    if (!soldier) {
      res.status(404).json({ success: false, message: "Soldier not found" });
      return;
    }

    const assignments = await Assignment.find({ soldier: soldier._id })
      .populate("task", "title description")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { soldier, assignments },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/manager/soldiers/:id/approve
export const approveSoldier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const soldier = await User.findOne({
      _id: req.params.id,
      role: "soldier",
    });

    if (!soldier) {
      res.status(404).json({ success: false, message: "Soldier not found" });
      return;
    }

    if (soldier.status !== ("pending" as any)) {
      res.status(400).json({
        success: false,
        message: "Soldier is not in pending status",
      });
      return;
    }

    soldier.status = "active";
    await soldier.save();

    res.status(200).json({
      success: true,
      message: "Soldier approved successfully",
      data: soldier,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/manager/soldiers/:id/status
export const updateSoldierStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const allowed = ["active", "on_leave", "inactive"];

    if (!allowed.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowed.join(", ")}`,
      });
      return;
    }

    const soldier = await User.findOneAndUpdate(
      { _id: req.params.id, role: "soldier" },
      { status },
      { new: true }
    ).select("-password");

    if (!soldier) {
      res.status(404).json({ success: false, message: "Soldier not found" });
      return;
    }

    res.status(200).json({ success: true, data: soldier });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

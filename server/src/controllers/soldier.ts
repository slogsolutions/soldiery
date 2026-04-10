import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { Task } from "../models/Task";
import { Assignment } from "../models/Assignment";

// GET /api/soldier/tasks — get all active tasks soldier can pick from
export const getAvailableTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find({ isActive: true })
      .select("title description")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: tasks });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/soldier/assignments — get my assignments
export const getMyAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: any = { soldier: req.user?.id };
    if (status) filter.status = status;

    const assignments = await Assignment.find(filter)
      .populate("task", "title description")
      .populate("assignedBy", "name rank")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: assignments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/soldier/assignments — self assign a task
export const selfAssign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId, startTime, endTime } = req.body;

    if (!taskId || !startTime || !endTime) {
      res.status(400).json({
        success: false,
        message: "taskId, startTime and endTime are required",
      });
      return;
    }

    if (new Date(endTime) <= new Date(startTime)) {
      res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
      return;
    }

    // check task exists and is active
    const task = await Task.findOne({ _id: taskId, isActive: true });
    if (!task) {
      res.status(404).json({
        success: false,
        message: "Task not found or no longer available",
      });
      return;
    }

    // check for overlapping assignment
    const overlap = await Assignment.findOne({
      soldier: req.user?.id,
      status: { $in: ["upcoming", "active", "pending_review"] },
      $or: [
        { startTime: { $lt: new Date(endTime), $gte: new Date(startTime) } },
        { endTime: { $gt: new Date(startTime), $lte: new Date(endTime) } },
        {
          startTime: { $lte: new Date(startTime) },
          endTime: { $gte: new Date(endTime) },
        },
      ],
    });

    if (overlap) {
      res.status(409).json({
        success: false,
        message: "You already have an assignment overlapping this time window",
      });
      return;
    }

    const now = new Date();
    const start = new Date(startTime);
    const status = start > now ? "upcoming" : "active";

    const assignment = await Assignment.create({
      soldier: req.user?.id,
      task: taskId,
      startTime: start,
      endTime: new Date(endTime),
      status,
      createdBy: "soldier",
    });

    const populated = await assignment.populate([
      { path: "task", select: "title description" },
    ]);

    res.status(201).json({ success: true, data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/soldier/assignments/:id/done — mark task as done
export const markAsDone = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      soldier: req.user?.id,
    });

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
      return;
    }

    if (!["active", "upcoming"].includes(assignment.status)) {
      res.status(400).json({
        success: false,
        message: `Cannot mark as done — current status is ${assignment.status}`,
      });
      return;
    }

    assignment.status = "pending_review";
    await assignment.save();

    res.status(200).json({
      success: true,
      message: "Task marked as done. Waiting for manager approval.",
      data: assignment,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
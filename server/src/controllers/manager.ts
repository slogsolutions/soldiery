import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { User } from "../models/User";
import { Task } from "../models/Task";
import { Assignment } from "../models/Assignment";

// ─────────────────────────────────────────────────────────────────────────────
// SOLDIER MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// TASK MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/manager/tasks
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: "Title is required" });
      return;
    }

    const task = await Task.create({
      title,
      description,
      createdBy: req.user?.id,
    });

    res.status(201).json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/manager/tasks
export const getAllTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find()
      .populate("createdBy", "name rank")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: tasks });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/manager/tasks/:id
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, isActive } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, isActive },
      { new: true, runValidators: true }
    );

    if (!task) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }

    res.status(200).json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/manager/tasks/:id  (soft delete — just deactivates)
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!task) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Task deactivated successfully",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGNMENT MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/manager/assignments
export const createAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { soldierId, taskId, startTime, endTime, notes, priority, location } = req.body;

    if (!soldierId || !taskId || !startTime || !endTime) {
      res.status(400).json({
        success: false,
        message: "soldierId, taskId, startTime and endTime are required",
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

    // check soldier exists and is active
    const soldier = await User.findOne({ _id: soldierId, role: "soldier", status: "active" });
    if (!soldier) {
      res.status(404).json({
        success: false,
        message: "Active soldier not found",
      });
      return;
    }

    // check task exists and is active
    const task = await Task.findOne({ _id: taskId, isActive: true });
    if (!task) {
      res.status(404).json({ success: false, message: "Active task not found" });
      return;
    }

    // check for overlapping assignment
    const overlap = await Assignment.findOne({
      soldier: soldierId,
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
        message: "Soldier already has an overlapping assignment in this time window",
      });
      return;
    }

    const now = new Date();
    const start = new Date(startTime);
    const status = start > now ? "upcoming" : "active";

    const assignment = await Assignment.create({
      soldier: soldierId,
      task: taskId,
      startTime: start,
      endTime: new Date(endTime),
      status,
      createdBy: "manager",
      assignedBy: req.user?.id,
      notes,
      priority,
      location,
    });

    const populated = await assignment.populate([
      { path: "soldier", select: "name rank armyNumber" },
      { path: "task", select: "title description" },
      { path: "assignedBy", select: "name rank" },
    ]);

    res.status(201).json({ success: true, data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/manager/assignments
export const getAllAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, soldierId } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (soldierId) filter.soldier = soldierId;

    const assignments = await Assignment.find(filter)
      .populate("soldier", "name rank armyNumber unit")
      .populate("task", "title description")
      .populate("assignedBy", "name rank")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: assignments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/manager/assignments/:id
export const getAssignmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("soldier", "name rank armyNumber unit")
      .populate("task", "title description")
      .populate("assignedBy", "name rank");

    if (!assignment) {
      res.status(404).json({ success: false, message: "Assignment not found" });
      return;
    }

    res.status(200).json({ success: true, data: assignment });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/manager/assignments/:id
export const updateAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { notes, priority, location, startTime, endTime } = req.body;

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      res.status(404).json({ success: false, message: "Assignment not found" });
      return;
    }

    if (["completed", "rejected"].includes(assignment.status)) {
      res.status(400).json({
        success: false,
        message: "Cannot edit a completed or rejected assignment",
      });
      return;
    }

    if (notes !== undefined) assignment.notes = notes;
    if (priority !== undefined) assignment.priority = priority;
    if (location !== undefined) assignment.location = location;
    if (startTime !== undefined) assignment.startTime = new Date(startTime);
    if (endTime !== undefined) assignment.endTime = new Date(endTime);

    await assignment.save();

    res.status(200).json({ success: true, data: assignment });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/manager/assignments/:id/approve
export const approveAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      res.status(404).json({ success: false, message: "Assignment not found" });
      return;
    }

    if (assignment.status !== "pending_review") {
      res.status(400).json({
        success: false,
        message: "Only assignments in pending_review can be approved",
      });
      return;
    }

    assignment.status = "completed";
    await assignment.save();

    res.status(200).json({
      success: true,
      message: "Assignment marked as completed",
      data: assignment,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/manager/assignments/:id/reject
export const rejectAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      res.status(404).json({ success: false, message: "Assignment not found" });
      return;
    }

    if (assignment.status !== "pending_review") {
      res.status(400).json({
        success: false,
        message: "Only assignments in pending_review can be rejected",
      });
      return;
    }

    assignment.status = "rejected";
    await assignment.save();

    res.status(200).json({
      success: true,
      message: "Assignment rejected, soldier remains on duty",
      data: assignment,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/manager/dashboard
export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();

    const allSoldiers = await User.find({ role: "soldier", status: "active" });
    const total = allSoldiers.length;

    // find all active assignments right now
    const activeAssignments = await Assignment.find({
      startTime: { $lte: now },
      endTime: { $gte: now },
      status: { $in: ["active", "pending_review"] },
    }).populate("task", "title");

    const busySoldierIds = new Set(
      activeAssignments.map((a) => a.soldier.toString())
    );

    const busy = busySoldierIds.size;
    const free = total - busy;

    // breakdown by task for detailed pie chart
    const taskBreakdown: Record<string, number> = {};
    activeAssignments.forEach((a) => {
      const taskTitle = (a.task as any)?.title || "Unknown";
      taskBreakdown[taskTitle] = (taskBreakdown[taskTitle] || 0) + 1;
    });

    // on leave count
    const onLeave = await User.countDocuments({
      role: "soldier",
      status: "on_leave",
    });

    // pending approval count
    const pendingApproval = await User.countDocuments({
      role: "soldier",
      status: "pending",
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        free,
        busy,
        onLeave,
        pendingApproval,
        // simple pie chart data
        pieChart: [
          { label: "Free", value: free, color: "#0F6E56" },
          { label: "Busy", value: busy, color: "#185FA5" },
          { label: "On Leave", value: onLeave, color: "#854F0B" },
        ],
        // detailed breakdown by task
        taskBreakdown: Object.entries(taskBreakdown).map(([task, count]) => ({
          task,
          count,
        })),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
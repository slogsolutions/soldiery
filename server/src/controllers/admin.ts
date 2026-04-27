import { Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Leave } from "../models/Leave";
import { Assignment } from "../models/Assignment";
import { Task } from "../models/Task";
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

    // Add leave and assignment status for each soldier
    const soldiersWithFullStatus = await Promise.all(
      soldiers.map(async (soldier) => {
        const currentDate = new Date();
        
        // 1. Check for active leave
        const activeLeave = await Leave.findOne({
          soldier: soldier._id,
          status: { $in: ["approved", "approved_by_manager"] },
          startDate: { $lte: currentDate },
          endDate: { $gte: currentDate }
        });

        // 2. Check for active assignment
        const activeAssignment = await Assignment.findOne({
          soldier: soldier._id,
          startTime: { $lte: currentDate },
          endTime: { $gte: currentDate },
          $or: [
            { status: { $in: ["active", "pending_review"] } },
            { status: { $exists: false } },
          ],
        }).populate("task", "title");

        return {
          ...soldier.toObject(),
          isOnLeave: !!activeLeave,
          isBusy: !!activeAssignment,
          currentTask: activeAssignment ? {
            title: (activeAssignment.task as any).title,
            startTime: activeAssignment.startTime,
            endTime: activeAssignment.endTime
          } : null,
          leaveDetails: activeLeave ? {
            reason: activeLeave.reason,
            startDate: activeLeave.startDate,
            endDate: activeLeave.endDate,
            finalDays: activeLeave.finalDays
          } : null
        };
      })
    );

    res.status(200).json({
      success: true,
      count: soldiersWithFullStatus.length,
      data: soldiersWithFullStatus,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get Admin Dashboard (System-wide Aggregates) ───────────────────────────
export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();

    // 1. Total Counts
    const totalManagers = await User.countDocuments({ role: "manager", status: "active" });
    const activeSoldiers = await User.find({ 
      role: "soldier", 
      status: { $in: ["active", "on_leave"] } 
    }).select("_id");
    const totalSoldiers = activeSoldiers.length;
    
    const validSoldierIds = new Set(activeSoldiers.map(s => s._id.toString()));

    // 2. Active Leaves
    const activeLeaves = await Leave.find({
      status: { $in: ["approved", "approved_by_manager"] },
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).distinct("soldier");

    const onLeaveIds = new Set(
      activeLeaves
        .filter(id => validSoldierIds.has(id.toString()))
        .map(id => id.toString())
    );

    // 3. Active Assignments
    const activeAssignments = await Assignment.find({
      startTime: { $lte: now },
      endTime: { $gte: now },
      $or: [
        { status: { $in: ["active", "pending_review"] } },
        { status: { $exists: false } },
      ],
    }).populate("task", "title type");

    // Only count as busy if soldier has active assignment AND is not on leave
    const busyIds = new Set();
    const taskBreakdown: Record<string, { count: number; title: string; type?: string }> = {};

    activeAssignments.forEach(assignment => {
      const soldierId = assignment.soldier.toString();
      if (validSoldierIds.has(soldierId) && !onLeaveIds.has(soldierId)) {
        busyIds.add(soldierId);
        
        // Aggregate task stats
        const task = assignment.task as any;
        if (task) {
          if (!taskBreakdown[task._id]) {
            taskBreakdown[task._id] = { count: 0, title: task.title, type: task.type };
          }
          taskBreakdown[task._id].count++;
        }
      }
    });

    const busy = busyIds.size;
    const onLeave = onLeaveIds.size;
    const free = totalSoldiers - busy - onLeave;

    res.status(200).json({
      success: true,
      data: {
        totalManagers,
        totalSoldiers,
        free,
        busy,
        onLeave,
        taskBreakdown: Object.values(taskBreakdown)
      },
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

// ─── Delete user ─────────────────────────────────────────────────────────────
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot delete admin accounts",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} deleted successfully`,
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

// ─────────────────────────────────────────
// ADMIN: VIEW SPECIFIC MANAGER
// ─────────────────────────────────────────

export const getManagerOverviewDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const managerId = req.params.id;
    const now = new Date();

    const soldiers = await User.find({
      role: "soldier",
      manager: managerId,
      status: "active",
    });

    const validSoldierIds = new Set(soldiers.map(s => s._id.toString()));

    // Get soldiers currently on leave
    const soldiersOnLeave = await Leave.find({
      manager: managerId,
      startDate: { $lte: now },
      endDate: { $gte: now },
      status: { $in: ["approved", "approved_by_manager"] },
    }).distinct("soldier");

    const soldiersOnLeaveIds = new Set(
      soldiersOnLeave
        .filter(id => validSoldierIds.has(id.toString()))
        .map(id => id.toString())
    );

    const activeAssignments = await Assignment.find({
      manager: managerId,
      startTime: { $lte: now },
      endTime: { $gte: now },
      $or: [
        { status: { $in: ["active", "pending_review"] } },
        { status: { $exists: false } },
      ],
    });

    // Only count as busy if soldier has active assignment AND is not on leave
    const busyAssignments = activeAssignments.filter(assignment => 
      validSoldierIds.has(assignment.soldier.toString()) && !soldiersOnLeaveIds.has(assignment.soldier.toString())
    );

    const busyIds = new Set(
      busyAssignments.map((a) => a.soldier.toString())
    );

    const busy = busyIds.size;
    const total = soldiers.length;
    const onLeave = soldiersOnLeaveIds.size;
    const free = total - busy - onLeave;

    res.status(200).json({
      success: true,
      data: { total, free, busy, onLeave },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getManagerOverviewSoldiers = async (req: AuthRequest, res: Response) => {
  try {
    const managerId = req.params.id;
    const soldiers = await User.find({
      role: "soldier",
      manager: managerId,
    }).select("-password");

    const now = new Date();

    const soldiersWithStatus = await Promise.all(
      soldiers.map(async (soldier) => {
        const activeAssignment = await Assignment.findOne({
          soldier: soldier._id,
          manager: managerId,
          startTime: { $lte: now },
          endTime: { $gte: now },
          $or: [
            { status: { $in: ["active", "pending_review"] } },
            { status: { $exists: false } },
          ],
        }).populate("task", "title");

        // Check if soldier is currently on leave
        const currentLeave = await Leave.findOne({
          soldier: soldier._id,
          startDate: { $lte: now },
          endDate: { $gte: now },
          status: { $in: ["approved", "approved_by_manager"] },
        });

        return {
          ...soldier.toJSON(),
          isBusy: !!activeAssignment,
          currentTask: activeAssignment ? {
            title: (activeAssignment.task as any).title,
            startTime: activeAssignment.startTime,
            endTime: activeAssignment.endTime
          } : null,
          isOnLeave: !!currentLeave,
          leaveDetails: currentLeave ? {
            reason: currentLeave.reason,
            startDate: currentLeave.startDate,
            endDate: currentLeave.endDate,
            finalDays: currentLeave.finalDays,
          } : null,
        };
      })
    );

    res.status(200).json({ success: true, data: soldiersWithStatus });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getManagerOverviewLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const managerId = req.params.id;
    const leaves = await Leave.find({
      manager: managerId,
    })
      .populate("soldier", "name rank armyNumber")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: leaves,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAdminTasks = async (req: AuthRequest, res: Response) => {
  try {
    const managerId = req.params.id || req.query.managerId;

    const filter: any = { isActive: true };
    if (managerId) {
      filter.manager = managerId;
    }

    const tasks = await Task.find(filter).select("title priority");
    res.status(200).json({ success: true, data: tasks });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────
// ASSIGNMENT MANAGEMENT
// ─────────────────────────────

export const createAdminAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { soldierId, taskId, startTime, endTime, notes, priority, location } = req.body;

    if (!soldierId || !taskId || !startTime || !endTime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({ message: "Invalid time range" });
    }

    // Verify soldier exists and is active
    const soldier = await User.findOne({
      _id: soldierId,
      role: "soldier",
      status: "active",
    });

    if (!soldier) {
      return res.status(404).json({ message: "Soldier not found or inactive" });
    }

    // Verify task exists and is active
    const task = await Task.findOne({
      _id: taskId,
      isActive: true,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found or inactive" });
    }

    // Check for overlapping assignments using valid statuses
    const overlap = await Assignment.findOne({
      soldier: soldierId,
      $or: [
        { status: { $in: ["active", "pending_review"] } },
        { status: { $exists: false } },
      ],
      $and: [
        {
          $or: [
            { startTime: { $lt: end, $gte: start } },
            { endTime: { $gt: start, $lte: end } },
            { startTime: { $lte: start }, endTime: { $gte: end } },
          ],
        },
      ],
    });

    if (overlap) {
      return res.status(409).json({ message: "Soldier has overlapping assignment" });
    }

    // Get the soldier's manager for the assignment
    const managerId = soldier.manager;

    const assignment = await Assignment.create({
      soldier: soldierId,
      task: taskId,
      manager: managerId,
      startTime: start,
      endTime: end,
      notes,
      priority,
      location,
      status: "active",
    });

    const populated = await assignment.populate([
      { path: "soldier", select: "name rank armyNumber" },
      { path: "task", select: "title" },
      { path: "manager", select: "name" },
    ]);

    res.status(201).json({ success: true, data: populated });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAdminAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const managerId = req.params.id || req.query.managerId;
    const { task } = req.query;

    const query: any = {};
    if (managerId) query.manager = managerId;
    if (task) query.task = task;

    const assignments = await Assignment.find(query)
      .populate("soldier", "name rank armyNumber")
      .populate("task", "title")
      .sort({ createdAt: -1 });

    const now = new Date();
    const result = assignments.map(a => {
      let status = "completed";
      if (now < a.startTime) status = "upcoming";
      else if (now >= a.startTime && now <= a.endTime) status = "active";
      
      return {
        ...a.toObject(),
        status
      };
    });

    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateAdminAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    const { startTime, endTime, notes, priority, location, status } = req.body;

    if (startTime) assignment.startTime = new Date(startTime);

    if (status === "completed") {
      assignment.status = "completed";
      assignment.endTime = new Date();
    } else if (endTime) {
      assignment.endTime = new Date(endTime);
    }

    if (notes !== undefined) assignment.notes = notes;
    if (priority !== undefined) assignment.priority = priority;
    if (location !== undefined) assignment.location = location;
    if (status && status !== "completed") assignment.status = status;

    // validation (admin can override but we keep basic sanity)
    if (assignment.status !== "completed" && assignment.endTime <= assignment.startTime) {
      return res.status(400).json({ success: false, message: "Invalid time range" });
    }

    await assignment.save();

    const populated = await assignment.populate([
      { path: "soldier", select: "name rank armyNumber" },
      { path: "task", select: "title" },
      { path: "manager", select: "name" },
    ]);

    res.status(200).json({ success: true, data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
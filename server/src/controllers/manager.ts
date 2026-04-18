import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { User } from "../models/User";
import { Task } from "../models/Task";
import { Assignment } from "../models/Assignment";
import { Leave } from "../models/Leave";
import bcrypt from "bcryptjs";


// ─────────────────────────────────────────────────────────────
// SOLDIER MANAGEMENT
// ─────────────────────────────────────────────────────────────


// ─── Create Soldier ─────────────────────────────────────────
export const createSoldier = async (req: AuthRequest, res: Response) => {
  try {
    const { name, password, armyNumber, rank, unit } = req.body;

    if (!name || !password || !armyNumber) {
      return res.status(400).json({
        success: false,
        message: "Name, password and armyNumber are required",
      });
    }

    // check duplicate army number
    const existing = await User.findOne({ armyNumber });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Army number already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const soldier = await User.create({
      name,
      password: hashedPassword,
      armyNumber,
      rank,
      unit,
      role: "soldier",
      manager: req.user!.id, // 🔥 important
      status: "active",
    });

    const data = await User.findById(soldier._id).select("-password");

    res.status(201).json({
      success: true,
      message: "Soldier created successfully",
      data,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllSoldiers = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    const soldiers = await User.find({
      role: "soldier",
      manager: req.user!.id,
      status: status || { $in: ["active", "on_leave"] },
    }).select("-password");

    const now = new Date();

    const soldiersWithStatus = await Promise.all(
      soldiers.map(async (soldier) => {
        // Check for active assignment
        const activeAssignment = await Assignment.findOne({
          soldier: soldier._id,
          startTime: { $lte: now },
          endTime: { $gte: now },
          $or: [
            { status: { $in: ["active", "pending_review"] } },
            { status: { $exists: false } },
          ],
        }).populate("task", "title");

        // Check for active approved leave
        const activeLeave = await Leave.findOne({
          soldier: soldier._id,
          status: { $in: ["approved", "approved_by_manager"] },
          startDate: { $lte: now },
          endDate: { $gte: now },
        });

        return {
          ...soldier.toJSON(),
          isBusy: !!activeAssignment,
          currentTask: activeAssignment?.task || null,
          isOnLeave: !!activeLeave,
          leaveDetails: activeLeave ? {
            reason: activeLeave.reason,
            startDate: activeLeave.startDate,
            endDate: activeLeave.endDate
          } : null
        };
      })
    );

    res.status(200).json({ success: true, data: soldiersWithStatus });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getSoldierById = async (req: AuthRequest, res: Response) => {
  try {
    const soldier = await User.findOne({
      _id: req.params.id,
      role: "soldier",
      manager: req.user!.id,
    }).select("-password");

    if (!soldier) {
      return res.status(404).json({ message: "Soldier not found" });
    }

    const assignments = await Assignment.find({
      soldier: soldier._id,
      manager: req.user!.id,
    })
      .populate("task", "title description")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { soldier, assignments },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// TASK MANAGEMENT
// ─────────────────────────────────────────────────────────────

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const task = await Task.create({
      title,
      description,
      createdBy: req.user!.id,
      manager: req.user!.id,
    });

    res.status(201).json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllTasks = async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await Task.find({
      manager: req.user!.id,
      isActive: true,
    })
      .populate("createdBy", "name rank")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: tasks });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, isActive } = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, manager: req.user!.id },
      { title, description, isActive },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, manager: req.user!.id },
      { isActive: false },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ success: true, message: "Task deactivated" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// ASSIGNMENT MANAGEMENT
// ─────────────────────────────────────────────────────────────

export const createAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { soldierId, taskId, startTime, endTime, notes, priority, location } =
      req.body;

    if (!soldierId || !taskId || !startTime || !endTime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({ message: "Invalid time range" });
    }

    const soldier = await User.findOne({
      _id: soldierId,
      role: "soldier",
      status: "active",
    });

    if (!soldier || soldier.manager?.toString() !== req.user!.id) {
      return res.status(403).json({ message: "Invalid soldier" });
    }

    const task = await Task.findOne({
      _id: taskId,
      isActive: true,
      manager: req.user!.id,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // 🔥 overlap check (NO STATUS)
    const overlap = await Assignment.findOne({
      soldier: soldierId,
      manager: req.user!.id,
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } },
      ],
    });

    if (overlap) {
      return res.status(409).json({ message: "Overlapping assignment" });
    }

    const assignment = await Assignment.create({
      soldier: soldierId,
      task: taskId,
      manager: req.user!.id,
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
    ]);

    res.status(201).json({ success: true, data: populated });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

const getStatus = (start: Date, end: Date) => {
  const now = new Date();
  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "active";
  return "completed";
};


export const getAllAssignments = async (req: AuthRequest,res: Response) => {
  try {
    const { soldierId, task } = req.query;

    const assignments = await Assignment.find({
      manager: req.user!.id,
      ...(soldierId && { soldier: soldierId }),
      ...(task && { task: task }),
    })
      .populate("soldier", "name rank armyNumber")
      .populate("task", "title")
      .sort({ createdAt: -1 });

    const result = assignments.map((a) => ({
      ...a.toObject(),
      status: getStatus(a.startTime, a.endTime),
    }));

    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAssignmentById = async (req: AuthRequest, res: Response) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      manager: req.user!.id,
    })
      .populate("soldier", "name rank")
      .populate("task", "title");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const result = {
      ...assignment.toObject(),
      status: getStatus(assignment.startTime, assignment.endTime),
    };

    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      manager: req.user!.id,
    });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const { startTime, endTime, notes, priority, location } = req.body;

    if (startTime) assignment.startTime = new Date(startTime);
    if (endTime) assignment.endTime = new Date(endTime);
    if (notes !== undefined) assignment.notes = notes;
    if (priority !== undefined) assignment.priority = priority;
    if (location !== undefined) assignment.location = location;

    // 🔥 validate time again
    if (assignment.endTime <= assignment.startTime) {
      return res.status(400).json({ message: "Invalid time range" });
    }

    await assignment.save();

    res.status(200).json({ success: true, data: assignment });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();

    const soldiers = await User.find({
      role: "soldier",
      manager: req.user!.id,
      status: { $in: ["active", "on_leave"] },
    });

    const activeAssignments = await Assignment.find({
      startTime: { $lte: now },
      endTime: { $gte: now },
      manager: req.user!.id,
      $or: [
        { status: { $in: ["active", "pending_review"] } },
        { status: { $exists: false } },
      ],
    });

    const activeLeaves = await Leave.find({
      manager: req.user!.id,
      status: { $in: ["approved", "approved_by_manager"] },
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    const onLeaveIds = new Set(activeLeaves.map(l => l.soldier.toString()));
    const busyIds = new Set(
      activeAssignments
        .filter(a => !onLeaveIds.has(a.soldier.toString()))
        .map((a) => a.soldier.toString())
    );

    const onLeave = onLeaveIds.size;
    const busy = busyIds.size;
    const total = soldiers.length;
    const free = total - busy - onLeave;

    res.status(200).json({
      success: true,
      data: {
        total,
        free,
        busy,
        onLeave,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


//Leave Management

// get all leaves of soldiers(manager unit) 
export const getManagerLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const leaves = await Leave.find({})
      .populate({
        path: "soldier",
        match: { manager: req.user!.id },
        select: "name rank armyNumber"
      })
      .sort({ createdAt: -1 });

    // Filter out leaves where soldier is null (not belonging to this manager)
    const filteredLeaves = leaves.filter(leave => leave.soldier);

    res.status(200).json({
      success: true,
      data: filteredLeaves,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// approve leave
export const approveLeaveByManager = async (req: AuthRequest,res: Response) => {
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

// reject leave
export const rejectLeaveByManager =  async (req:AuthRequest,res:Response)=>{

  try {
    const leave = await Leave.findOne({
      _id:req.params.id,
      manager:req.user!.id,

    })

    if(!leave){
      return res.status(404).json({message:"Leave not found"})
    }

    if(leave.status !== "pending"){
      return res.status(400).json({message:"Only pending request can be reject can be reject"})
    }
    
    leave.status = "rejected"
    leave.managerId = req.user!.id

    await leave.save()

    res.status(200).json({
      success:true,
      message:"Leave rejeceted by manager",
      data: leave,
    })
    
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

//Edit leave
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
      message: "Leave updated by manager",
      data: leave,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


// send leave to admin 
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
      message: "Leave sent to admin for final approval",
      data: leave,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
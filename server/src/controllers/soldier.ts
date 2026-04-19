import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { Assignment } from "../models/Assignment";

const getStatus = (start: Date, end: Date) => {
  const now = new Date();

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "active";
  return "completed";
};


// GET /api/soldier/assignments — get my assignments
export const getMyAssignments = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const assignments = await Assignment.find({
      soldier: req.user!.id,
      endTime: { $gte: today },
    })
      .populate("task", "title description")
      .sort({ startTime: 1 });

    const result = assignments.map((a) => ({
      ...a.toObject(),
      status: getStatus(a.startTime, a.endTime), // 🔥 computed
    }));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
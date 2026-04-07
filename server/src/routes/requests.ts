import { Router, Response } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { AuthenticatedRequest } from "../types/index.js";
import RequestModel from "../models/Request.js";
import UserProfile from "../models/UserProfile.js";
import User from "../models/User.js";

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isObject(value: any): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

async function ensureProfile(userId: string) {
  const existing = await UserProfile.findOne({ userId });
  if (existing) return existing;
  return UserProfile.create({ userId });
}

async function applyApprovedRequest(reqRow: any) {
  const { type, data } = reqRow;
  const { userId } = data || {};
  if (!userId) return;

  await ensureProfile(userId);

  switch (type) {
    case "LEAVE": {
      const profile = await UserProfile.findOne({ userId }).select("leaveData");
      const leaveData = isObject(profile?.leaveData) ? profile.leaveData : {};
      const requests = isArray((leaveData as any).requests)
        ? (leaveData as any).requests
        : [];
      requests.push({ ...data.leave, approvedAt: new Date().toISOString() });
      await UserProfile.findOneAndUpdate(
        { userId },
        { leaveData: { ...leaveData, requests }, updatedAt: new Date() },
        { upsert: true }
      );
      break;
    }
    case "OUTPASS": {
      const profile = await UserProfile.findOne({ userId }).select("leaveData");
      const leaveData = isObject(profile?.leaveData) ? profile.leaveData : {};
      const outpasses = isArray((leaveData as any).outpasses)
        ? (leaveData as any).outpasses
        : [];
      outpasses.push({ ...data.outpass, approvedAt: new Date().toISOString() });
      await UserProfile.findOneAndUpdate(
        { userId },
        { leaveData: { ...leaveData, outpasses }, updatedAt: new Date() },
        { upsert: true }
      );
      break;
    }
    case "SALARY": {
      const profile = await UserProfile.findOne({ userId }).select("salaryData");
      const current = isObject(profile?.salaryData) ? profile.salaryData : {};
      const safeSalary = isObject(data.salary) ? data.salary : {};
      await UserProfile.findOneAndUpdate(
        { userId },
        { salaryData: { ...current, ...safeSalary }, updatedAt: new Date() },
        { upsert: true }
      );
      break;
    }
    case "PROFILE_UPDATE": {
      const { section, data: sectionData } = data;
      const map: Record<string, string> = {
        personal: "personalDetails",
        family: "family",
        education: "education",
        medical: "medical",
        others: "others",
        leave: "leaveData",
        salary: "salaryData",
      };
      const field = map[section];
      if (!field) return;
      await UserProfile.findOneAndUpdate(
        { userId },
        { [field]: sectionData, updatedAt: new Date() },
        { upsert: true }
      );
      break;
    }
    default:
      break;
  }
}

// ─── Admin: List Requests ─────────────────────────────────────────────────────

router.get(
  "/admin/requests",
  requireAuth,
  requireRole("ADMIN"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const status = req.query.status && String(req.query.status).toUpperCase();
      const type = req.query.type && String(req.query.type).toUpperCase();

      const filter: any = {};
      if (status) filter.status = status;
      if (type) filter.type = type;

      const requests = await RequestModel.find(filter)
        .populate("requesterId", "username email role")
        .sort({ createdAt: -1 });

      // Collect all unique target user IDs from request data
      const userIds = [
        ...new Set(
          requests
            .map((r: any) => {
              const d = r.data as any;
              return isObject(d) && typeof d.userId === "string" ? d.userId : null;
            })
            .filter(Boolean)
        ),
      ];

      const targetUsers =
        userIds.length > 0
          ? await User.find({ _id: { $in: userIds } }).select(
              "username email armyNumber role"
            )
          : [];

      const userMap = new Map(targetUsers.map((u) => [u._id.toString(), u]));

      const transformed = requests.map((r: any) => {
        const d = r.data as any;
        const targetUser =
          isObject(d) && typeof d.userId === "string"
            ? userMap.get(d.userId) || null
            : null;

        return {
          id: r._id,
          type: r.type,
          status: r.status,
          data: r.data,
          adminRemark: r.adminRemark,
          managerResponse: r.managerResponse,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          requesterId: r.requesterId?._id,
          requester: r.requesterId
            ? {
                id: r.requesterId._id,
                username: r.requesterId.username,
                email: r.requesterId.email,
                role: r.requesterId.role,
              }
            : null,
          targetUser: targetUser
            ? {
                id: targetUser._id,
                username: targetUser.username,
                email: targetUser.email,
                armyNumber: targetUser.armyNumber,
                role: targetUser.role,
              }
            : null,
        };
      });

      res.json({ ok: true, requests: transformed });
    } catch (e) {
      console.error("List requests error:", e);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

// ─── Admin: Approve Request ───────────────────────────────────────────────────

router.post(
  "/admin/requests/:id/approve",
  requireAuth,
  requireRole("ADMIN"),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      const request = await RequestModel.findById(id);
      if (!request) return res.status(404).json({ error: "Request not found" });
      if (request.status !== "PENDING")
        return res.status(400).json({ error: "Request not pending" });

      const updated = await RequestModel.findByIdAndUpdate(
        id,
        { status: "APPROVED" },
        { new: true }
      );

      // Apply profile updates in background
      applyApprovedRequest(updated).catch((e) => {
        console.error("Background profile update failed:", e);
      });

      res.json({ ok: true, request: updated });
    } catch (e) {
      console.error("Approve request error:", e);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

// ─── Admin: Reject Request ────────────────────────────────────────────────────

router.post(
  "/admin/requests/:id/reject",
  requireAuth,
  requireRole("ADMIN"),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { remark } = req.body || {};
    try {
      const request = await RequestModel.findById(id);
      if (!request) return res.status(404).json({ error: "Request not found" });
      if (request.status !== "PENDING")
        return res.status(400).json({ error: "Request not pending" });
      if (!remark || typeof remark !== "string" || remark.trim().length === 0)
        return res.status(400).json({ error: "Remark is required for rejection" });

      const updated = await RequestModel.findByIdAndUpdate(
        id,
        {
          status: "REJECTED",
          adminRemark: remark.trim(),
          data: {
            ...(isObject(request.data) ? request.data : {}),
            rejectionReason: remark.trim(),
          },
        },
        { new: true }
      );

      res.json({ ok: true, request: updated });
    } catch (e) {
      console.error("Reject request error:", e);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

// ─── Manager: Resubmit Rejected Request ──────────────────────────────────────

router.post(
  "/manager/requests/:id/resubmit",
  requireAuth,
  requireRole("MANAGER"),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { response, updatedData } = req.body || {};
    try {
      const request = await RequestModel.findById(id);
      if (!request) return res.status(404).json({ error: "Request not found" });
      if (request.status !== "REJECTED")
        return res.status(400).json({ error: "Request is not rejected" });
      if (request.requesterId.toString() !== req.auth.userId)
        return res.status(403).json({ error: "Not authorized to resubmit this request" });
      if (!response || typeof response !== "string" || response.trim().length === 0)
        return res.status(400).json({ error: "Response to admin remark is required" });

      const newData = updatedData
        ? { ...(isObject(request.data) ? request.data : {}), ...updatedData }
        : request.data;

      const updated = await RequestModel.findByIdAndUpdate(
        id,
        {
          status: "PENDING",
          managerResponse: response.trim(),
          data: newData,
        },
        { new: true }
      );

      res.json({ ok: true, request: updated });
    } catch (e) {
      console.error("Resubmit request error:", e);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

export default router;
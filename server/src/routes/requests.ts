import { Router, Response } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { AuthenticatedRequest } from "../types/index.js";
import RequestModel from "../models/Request.js";
import UserProfile from "../models/UserProfile.js";
import User from "../models/User.js";

// ─── Types ────────────────────────────────────────────────────────────────────

type RequestType = "LEAVE" | "OUTPASS" | "SALARY" | "PROFILE_UPDATE";

type AllowedSection = "personal" | "family" | "education" | "medical" | "others" | "leave" | "salary";

interface LeaveEntry {
  approvedAt: string;
  [key: string]: unknown;
}

interface LeaveData {
  requests?: LeaveEntry[];
  outpasses?: LeaveEntry[];
  [key: string]: unknown;
}

interface RequestPayload {
  type: RequestType;
  data: unknown;
}

interface RequestWithUserId {
  userId: string;
  leave?: Record<string, unknown>;
  outpass?: Record<string, unknown>;
  salary?: Record<string, unknown>;
  section?: AllowedSection;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

const SECTION_FIELD_MAP: Record<AllowedSection, string> = {
  personal: "personalDetails",
  family: "family",
  education: "education",
  medical: "medical",
  others: "others",
  leave: "leaveData",
  salary: "salaryData",
};

// ─── Setup ────────────────────────────────────────────────────────────────────

const router = Router();

// ─── Type Guards ──────────────────────────────────────────────────────────────

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isLeaveArray(value: unknown): value is LeaveEntry[] {
  return isArray(value);
}

function hasUserId(value: unknown): value is RequestWithUserId {
  return isObject(value) && typeof value.userId === "string";
}

function isAllowedSection(value: unknown): value is AllowedSection {
  return typeof value === "string" && value in SECTION_FIELD_MAP;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function ensureProfile(userId: string) {
  const existing = await UserProfile.findOne({ userId });
  if (existing) return existing;
  return UserProfile.create({ userId });
}

async function applyApprovedRequest(reqRow: RequestPayload): Promise<void> {
  const { type, data } = reqRow;

  if (!hasUserId(data)) return;
  const { userId } = data;

  await ensureProfile(userId);

  switch (type) {
    case "LEAVE": {
      const profile = await UserProfile.findOne({ userId }).select("leaveData");
      const leaveData: LeaveData = isObject(profile?.leaveData)
        ? (profile.leaveData as LeaveData)
        : {};
      const requests: LeaveEntry[] = isLeaveArray(leaveData.requests)
        ? leaveData.requests
        : [];

      const leaveEntry = isObject(data.leave) ? data.leave : {};
      requests.push({ ...leaveEntry, approvedAt: new Date().toISOString() });

      await UserProfile.findOneAndUpdate(
        { userId },
        { leaveData: { ...leaveData, requests }, updatedAt: new Date() },
        { upsert: true }
      );
      break;
    }
    case "OUTPASS": {
      const profile = await UserProfile.findOne({ userId }).select("leaveData");
      const leaveData: LeaveData = isObject(profile?.leaveData)
        ? (profile.leaveData as LeaveData)
        : {};
      const outpasses: LeaveEntry[] = isLeaveArray(leaveData.outpasses)
        ? leaveData.outpasses
        : [];

      const outpassEntry = isObject(data.outpass) ? data.outpass : {};
      outpasses.push({ ...outpassEntry, approvedAt: new Date().toISOString() });

      await UserProfile.findOneAndUpdate(
        { userId },
        { leaveData: { ...leaveData, outpasses }, updatedAt: new Date() },
        { upsert: true }
      );
      break;
    }
    case "SALARY": {
      const profile = await UserProfile.findOne({ userId }).select("salaryData");
      const current: Record<string, unknown> = isObject(profile?.salaryData)
        ? (profile.salaryData as Record<string, unknown>)
        : {};
      const safeSalary: Record<string, unknown> = isObject(data.salary) ? data.salary : {};

      await UserProfile.findOneAndUpdate(
        { userId },
        { salaryData: { ...current, ...safeSalary }, updatedAt: new Date() },
        { upsert: true }
      );
      break;
    }
    case "PROFILE_UPDATE": {
      const section = data.section;
      const sectionData = data.data;

      if (!isAllowedSection(section)) return;

      const field = SECTION_FIELD_MAP[section];
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
      const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;
      const type = req.query.type ? String(req.query.type).toUpperCase() : undefined;

      const filter: Record<string, string> = {};
      if (status) filter.status = status;
      if (type) filter.type = type;

      const requests = await RequestModel.find(filter)
        .populate("requesterId", "username email role")
        .sort({ createdAt: -1 });

      const userIds = [
        ...new Set(
          requests
            .map((r) => {
              const d: unknown = (r as unknown as { data: unknown }).data;
              return hasUserId(d) ? d.userId : null;
            })
            .filter((id): id is string => id !== null)
        ),
      ];

      const targetUsers =
        userIds.length > 0
          ? await User.find({ _id: { $in: userIds } }).select(
              "username email armyNumber role"
            )
          : [];

      const userMap = new Map(targetUsers.map((u) => [u._id.toString(), u]));

      const transformed = requests.map((r) => {
        const row = r as unknown as {
          _id: unknown;
          type: string;
          status: string;
          data: unknown;
          adminRemark?: string;
          managerResponse?: string;
          createdAt: Date;
          updatedAt: Date;
          requesterId: { _id: unknown; username: string; email: string; role: string } | null;
        };

        const d = row.data;
        const targetUserId = hasUserId(d) ? d.userId : null;
        const targetUser = targetUserId ? (userMap.get(targetUserId) ?? null) : null;

        return {
          id: row._id,
          type: row.type,
          status: row.status,
          data: row.data,
          adminRemark: row.adminRemark,
          managerResponse: row.managerResponse,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          requesterId: row.requesterId?._id,
          requester: row.requesterId
            ? {
                id: row.requesterId._id,
                username: row.requesterId.username,
                email: row.requesterId.email,
                role: row.requesterId.role,
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
    } catch (e: unknown) {
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
      if (request.status !== "PENDING") {
        return res.status(400).json({ error: "Request not pending" });
      }

      const updated = await RequestModel.findByIdAndUpdate(
        id,
        { status: "APPROVED" },
        { new: true }
      );

      if (updated) {
        applyApprovedRequest(updated as unknown as RequestPayload).catch((e: unknown) => {
          console.error("Background profile update failed:", e);
        });
      }

      return res.json({ ok: true, request: updated });
    } catch (e: unknown) {
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
    const { remark } = (req.body ?? {}) as { remark?: unknown };

    try {
      const request = await RequestModel.findById(id);
      if (!request) return res.status(404).json({ error: "Request not found" });
      if (request.status !== "PENDING") {
        return res.status(400).json({ error: "Request not pending" });
      }
      if (!remark || typeof remark !== "string" || remark.trim().length === 0) {
        return res.status(400).json({ error: "Remark is required for rejection" });
      }

      const existingData: Record<string, unknown> = isObject(request.data)
        ? (request.data as Record<string, unknown>)
        : {};

      const updated = await RequestModel.findByIdAndUpdate(
        id,
        {
          status: "REJECTED",
          adminRemark: remark.trim(),
          data: { ...existingData, rejectionReason: remark.trim() },
        },
        { new: true }
      );

      return res.json({ ok: true, request: updated });
    } catch (e: unknown) {
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
    const { response, updatedData } = (req.body ?? {}) as {
      response?: unknown;
      updatedData?: Record<string, unknown>;
    };

    try {
      const request = await RequestModel.findById(id);
      if (!request) return res.status(404).json({ error: "Request not found" });
      if (request.status !== "REJECTED") {
        return res.status(400).json({ error: "Request is not rejected" });
      }
      if (request.requesterId.toString() !== req.auth.userId) {
        return res.status(403).json({ error: "Not authorized to resubmit this request" });
      }
      if (!response || typeof response !== "string" || response.trim().length === 0) {
        return res.status(400).json({ error: "Response to admin remark is required" });
      }

      const existingData: Record<string, unknown> = isObject(request.data)
        ? (request.data as Record<string, unknown>)
        : {};

      const newData: Record<string, unknown> = updatedData
        ? { ...existingData, ...updatedData }
        : existingData;

      const updated = await RequestModel.findByIdAndUpdate(
        id,
        { status: "PENDING", managerResponse: response.trim(), data: newData },
        { new: true }
      );

      return res.json({ ok: true, request: updated });
    } catch (e: unknown) {
      console.error("Resubmit request error:", e);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

export default router;
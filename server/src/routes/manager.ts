import { Router, Response } from "express";
import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";
import Request from "../models/Request.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { AuthenticatedRequest } from "../types/index.js";

const router = Router();

// ─── Helper ───────────────────────────────────────────────────────────────────

async function createRequest(requesterId: string, type: string, data: any) {
  const request = await Request.create({
    type,
    data,
    requesterId,
    status: "PENDING",
  });
  return request;
}

// ─── Manager: List All Users ──────────────────────────────────────────────────

router.get(
  "/manager/users",
  requireAuth,
  requireRole("MANAGER"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log(
        "🔍 /api/manager/users called by userId:",
        req.auth?.userId,
        "role:",
        req.auth?.role
      );

      const users = await User.find()
        .select("username email role armyNumber")
        .sort({ username: 1 });

      console.log(`✅ /api/manager/users successful: Found ${users.length} users`);

      res.json(
        users.map((u) => ({
          id: u._id,
          username: u.username,
          email: u.email,
          role: u.role,
          armyNumber: u.armyNumber,
        }))
      );
    } catch (e: any) {
      console.error("❌ /api/manager/users exception:", e);
      res.status(500).json({ error: "Internal error", details: e?.message });
    }
  }
);

// ─── Manager: Get User Profile ────────────────────────────────────────────────

router.get(
  "/manager/users/:id/profile",
  requireAuth,
  requireRole("MANAGER"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const user = await User.findById(id).select(
        "username email role armyNumber"
      );
      if (!user) return res.status(404).json({ error: "User not found" });

      const profile = await UserProfile.findOne({ userId: id });

      return res.json({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        armyNumber: user.armyNumber,
        profile: profile || null,
      });
    } catch (e) {
      console.error("Get user profile for manager error:", e);
      return res.status(500).json({ error: "Internal error" });
    }
  }
);

// ─── Manager: Create Leave Request ───────────────────────────────────────────

router.post(
  "/manager/requests/leave",
  requireAuth,
  requireRole("MANAGER"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requesterId = req.auth.userId;
      const { userId, leave } = req.body;
      if (!userId || !leave)
        return res.status(400).json({ error: "Missing userId or leave" });

      const user = await User.findById(userId).select("_id");
      if (!user) return res.status(404).json({ error: "Target user not found" });

      const request = await createRequest(requesterId, "LEAVE", { userId, leave });
      return res.json({ ok: true, request });
    } catch (e) {
      console.error("Create leave request error:", e);
      return res.status(500).json({ error: "Internal error" });
    }
  }
);

// ─── Manager: Create Outpass Request ─────────────────────────────────────────

router.post(
  "/manager/requests/outpass",
  requireAuth,
  requireRole("MANAGER"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requesterId = req.auth.userId;
      const { userId, outpass } = req.body;
      if (!userId || !outpass)
        return res.status(400).json({ error: "Missing userId or outpass" });

      const user = await User.findById(userId).select("_id");
      if (!user) return res.status(404).json({ error: "Target user not found" });

      const request = await createRequest(requesterId, "OUTPASS", { userId, outpass });
      return res.json({ ok: true, request });
    } catch (e) {
      console.error("Create outpass request error:", e);
      return res.status(500).json({ error: "Internal error" });
    }
  }
);

// ─── Manager: Create Salary Request ──────────────────────────────────────────

router.post(
  "/manager/requests/salary",
  requireAuth,
  requireRole("MANAGER"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requesterId = req.auth.userId;
      const { userId, salary } = req.body;
      if (!userId || !salary)
        return res.status(400).json({ error: "Missing userId or salary" });

      const user = await User.findById(userId).select("_id");
      if (!user) return res.status(404).json({ error: "Target user not found" });

      const request = await createRequest(requesterId, "SALARY", { userId, salary });
      return res.json({ ok: true, request });
    } catch (e) {
      console.error("Create salary request error:", e);
      return res.status(500).json({ error: "Internal error" });
    }
  }
);

// ─── Manager: Create Profile Edit Request ────────────────────────────────────

router.post(
  "/manager/requests/profile-edit",
  requireAuth,
  requireRole("MANAGER"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requesterId = req.auth.userId;
      const { userId, section, data } = req.body;
      const allowed = new Set([
        "personal",
        "family",
        "education",
        "medical",
        "others",
        "leave",
        "salary",
      ]);

      if (!userId || !section || data === undefined)
        return res.status(400).json({ error: "Missing userId, section or data" });
      if (!allowed.has(section))
        return res.status(400).json({ error: "Invalid section" });

      const user = await User.findById(userId).select("_id");
      if (!user) return res.status(404).json({ error: "Target user not found" });

      const request = await createRequest(requesterId, "PROFILE_UPDATE", {
        userId,
        section,
        data,
      });
      return res.json({ ok: true, request });
    } catch (e) {
      console.error("Create profile update request error:", e);
      return res.status(500).json({ error: "Internal error" });
    }
  }
);

// ─── Manager: List All Requests ───────────────────────────────────────────────

router.get(
  "/manager/requests",
  requireAuth,
  requireRole("MANAGER"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const managerId = req.auth.userId;
      console.log("🔍 /api/manager/requests called by manager userId:", managerId);

      const status = req.query.status && String(req.query.status).toUpperCase();
      const type = req.query.type && String(req.query.type).toUpperCase();

      // Build filter
      const filter: any = {};
      if (status) filter.status = status;
      if (type) filter.type = type;

      const requests = await Request.find(filter)
        .populate("requesterId", "username email role")
        .sort({ createdAt: -1 });

      console.log(`✅ /api/manager/requests found ${requests.length} total requests`);

      // Collect all unique target user IDs from request data
      const userIds = [
        ...new Set(
          requests
            .map((r: any) => {
              const d = r.data as any;
              return d && typeof d.userId === "string" ? d.userId : null;
            })
            .filter(Boolean)
        ),
      ];

      // Fetch all target users in one query
      const targetUsers = userIds.length > 0
        ? await User.find({ _id: { $in: userIds } }).select(
            "username email armyNumber role"
          )
        : [];

      const userMap = new Map(
        targetUsers.map((u) => [u._id.toString(), u])
      );

      const transformed = requests.map((r: any) => {
        const d = r.data as any;
        const targetUser =
          d && typeof d.userId === "string"
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

      return res.json({ ok: true, requests: transformed });
    } catch (e: any) {
      console.error("❌ /api/manager/requests exception:", e);
      return res.status(500).json({ error: "Internal error", details: e?.message });
    }
  }
);

export default router;
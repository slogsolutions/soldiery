import { Router, Response } from "express";
import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";
import Request from "../models/Request.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { AuthenticatedRequest } from "../types/index.js";

// ─── Types ────────────────────────────────────────────────────────────────────

type RequestType = "LEAVE" | "OUTPASS" | "SALARY" | "PROFILE_UPDATE";

type AllowedSection =
  | "personal"
  | "family"
  | "education"
  | "medical"
  | "others"
  | "leave"
  | "salary";

interface RequestData {
  userId: string;
  leave?: Record<string, unknown>;
  outpass?: Record<string, unknown>;
  salary?: Record<string, unknown>;
  section?: AllowedSection;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

interface PopulatedRequester {
  _id: unknown;
  username: string;
  email: string;
  role: string;
}

interface PopulatedRequest {
  _id: unknown;
  type: RequestType;
  status: string;
  data: unknown;
  adminRemark?: string;
  managerResponse?: string;
  createdAt: Date;
  updatedAt: Date;
  requesterId: PopulatedRequester | null;
}

// ─── Setup ────────────────────────────────────────────────────────────────────

const router = Router();

// ─── Helper ───────────────────────────────────────────────────────────────────

async function createRequest(
  requesterId: string,
  type: RequestType,
  data: RequestData,
) {
  return Request.create({
    type,
    data: data as Record<string, unknown>,
    requesterId,
    status: "PENDING",
  });
}

function isRequestData(value: unknown): value is RequestData {
  return (
    typeof value === "object" &&
    value !== null &&
    "userId" in value &&
    typeof (value as RequestData).userId === "string"
  );
}

const ALLOWED_SECTIONS = new Set<AllowedSection>([
  "personal",
  "family",
  "education",
  "medical",
  "others",
  "leave",
  "salary",
]);

function isAllowedSection(value: unknown): value is AllowedSection {
  return (
    typeof value === "string" && ALLOWED_SECTIONS.has(value as AllowedSection)
  );
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
        req.auth?.role,
      );

      const users = await User.find()
        .select("username email role armyNumber")
        .sort({ username: 1 });

      console.log(
        `✅ /api/manager/users successful: Found ${users.length} users`,
      );

      return res.json(
        users.map((u) => ({
          id: u._id,
          username: u.username,
          email: u.email,
          role: u.role,
          armyNumber: u.armyNumber,
        })),
      );
    } catch (e: unknown) {
      console.error("❌ /api/manager/users exception:", e);
      const message = e instanceof Error ? e.message : "Unknown error";
      return res
        .status(500)
        .json({ error: "Internal error", details: message });
    }
  },
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
        "username email role armyNumber",
      );
      if (!user) return res.status(404).json({ error: "User not found" });

      const profile = await UserProfile.findOne({ userId: id });

      return res.json({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        armyNumber: user.armyNumber,
        profile: profile ?? null,
      });
    } catch (e: unknown) {
      console.error("Get user profile for manager error:", e);
      return res.status(500).json({ error: "Internal error" });
    }
  },
);

// ─── Manager: Create Leave Request ───────────────────────────────────────────

router.post(
  "/manager/requests/leave",
  requireAuth,
  requireRole("MANAGER"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requesterId = req.auth.userId;
      const { userId, leave } = req.body as {
        userId?: string;
        leave?: Record<string, unknown>;
      };

      if (!userId || !leave) {
        return res.status(400).json({ error: "Missing userId or leave" });
      }

      const user = await User.findById(userId).select("_id");
      if (!user)
        return res.status(404).json({ error: "Target user not found" });

      const request = await createRequest(requesterId, "LEAVE", {
        userId,
        leave,
      });
      return res.json({ ok: true, request });
    } catch (e: unknown) {
      console.error("Create leave request error:", e);
      return res.status(500).json({ error: "Internal error" });
    }
  },
);

// ─── Manager: Create Outpass Request ─────────────────────────────────────────

router.post(
  "/manager/requests/outpass",
  requireAuth,
  requireRole("MANAGER"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requesterId = req.auth.userId;
      const { userId, outpass } = req.body as {
        userId?: string;
        outpass?: Record<string, unknown>;
      };

      if (!userId || !outpass) {
        return res.status(400).json({ error: "Missing userId or outpass" });
      }

      const user = await User.findById(userId).select("_id");
      if (!user)
        return res.status(404).json({ error: "Target user not found" });

      const request = await createRequest(requesterId, "OUTPASS", {
        userId,
        outpass,
      });
      return res.json({ ok: true, request });
    } catch (e: unknown) {
      console.error("Create outpass request error:", e);
      return res.status(500).json({ error: "Internal error" });
    }
  },
);

// ─── Manager: Create Salary Request ──────────────────────────────────────────

router.post(
  "/manager/requests/salary",
  requireAuth,
  requireRole("MANAGER"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requesterId = req.auth.userId;
      const { userId, salary } = req.body as {
        userId?: string;
        salary?: Record<string, unknown>;
      };

      if (!userId || !salary) {
        return res.status(400).json({ error: "Missing userId or salary" });
      }

      const user = await User.findById(userId).select("_id");
      if (!user)
        return res.status(404).json({ error: "Target user not found" });

      const request = await createRequest(requesterId, "SALARY", {
        userId,
        salary,
      });
      return res.json({ ok: true, request });
    } catch (e: unknown) {
      console.error("Create salary request error:", e);
      return res.status(500).json({ error: "Internal error" });
    }
  },
);

// ─── Manager: Create Profile Edit Request ────────────────────────────────────

router.post(
  "/manager/requests/profile-edit",
  requireAuth,
  requireRole("MANAGER"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requesterId = req.auth.userId;
      const { userId, section, data } = req.body as {
        userId?: string;
        section?: unknown;
        data?: Record<string, unknown>;
      };

      if (!userId || !section || data === undefined) {
        return res
          .status(400)
          .json({ error: "Missing userId, section or data" });
      }

      if (!isAllowedSection(section)) {
        return res.status(400).json({ error: "Invalid section" });
      }

      const user = await User.findById(userId).select("_id");
      if (!user)
        return res.status(404).json({ error: "Target user not found" });

      const request = await createRequest(requesterId, "PROFILE_UPDATE", {
        userId,
        section,
        data,
      });

      return res.json({ ok: true, request });
    } catch (e: unknown) {
      console.error("Create profile update request error:", e);
      return res.status(500).json({ error: "Internal error" });
    }
  },
);

// ─── Manager: List All Requests ───────────────────────────────────────────────

router.get(
  "/manager/requests",
  requireAuth,
  requireRole("MANAGER"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const managerId = req.auth.userId;
      console.log(
        "🔍 /api/manager/requests called by manager userId:",
        managerId,
      );

      const status = req.query.status
        ? String(req.query.status).toUpperCase()
        : undefined;
      const type = req.query.type
        ? String(req.query.type).toUpperCase()
        : undefined;

      const filter: Record<string, string> = {};
      if (status) filter.status = status;
      if (type) filter.type = type;

      const requests = await Request.find(filter)
        .populate("requesterId", "username email role")
        .sort({ createdAt: -1 });

      console.log(
        `✅ /api/manager/requests found ${requests.length} total requests`,
      );

      const userIds = [
        ...new Set(
          requests
            .map((r) => {
              const d = (r as unknown as PopulatedRequest).data;
              return isRequestData(d) ? d.userId : null;
            })
            .filter((id): id is string => id !== null),
        ),
      ];

      const targetUsers =
        userIds.length > 0
          ? await User.find({ _id: { $in: userIds } }).select(
              "username email armyNumber role",
            )
          : [];

      const userMap = new Map(targetUsers.map((u) => [u._id.toString(), u]));

      const transformed = requests.map((r) => {
        const req = r as unknown as PopulatedRequest;
        const d = req.data;
        const targetUserId = isRequestData(d) ? d.userId : null;
        const targetUser = targetUserId
          ? (userMap.get(targetUserId) ?? null)
          : null;

        return {
          id: req._id,
          type: req.type,
          status: req.status,
          data: req.data,
          adminRemark: req.adminRemark,
          managerResponse: req.managerResponse,
          createdAt: req.createdAt,
          updatedAt: req.updatedAt,
          requesterId: req.requesterId?._id,
          requester: req.requesterId
            ? {
                id: req.requesterId._id,
                username: req.requesterId.username,
                email: req.requesterId.email,
                role: req.requesterId.role,
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
    } catch (e: unknown) {
      console.error("❌ /api/manager/requests exception:", e);
      const message = e instanceof Error ? e.message : "Unknown error";
      return res
        .status(500)
        .json({ error: "Internal error", details: message });
    }
  },
);

export default router;

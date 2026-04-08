import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { AuthenticatedRequest } from "../types/index.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface JwtPayload {
  userId: string;
  role: string;
}

interface MonthlyRegistration {
  month: string;
  count: number;
}

interface RoleDistribution {
  USER: number;
  ADMIN: number;
}

interface RecentRegistration {
  id: unknown;
  username: string;
  email: string;
  role: string;
  createdAt: Date;
}

// ─── Setup ────────────────────────────────────────────────────────────────────

const router = Router();

// ─── Helper ───────────────────────────────────────────────────────────────────

function setAuthCookie(res: Response, payload: JwtPayload): void {
  const secret = process.env.JWT_SECRET ?? "dev-secret";
  const token = jwt.sign(payload, secret, { expiresIn: "7d" });

  const isProdLike =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.RENDER);

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProdLike,
    sameSite: isProdLike ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
    domain: undefined,
  });
}

// ─── Signup ───────────────────────────────────────────────────────────────────

router.post("/signup", async (req: Request, res: Response) => {
  const { username, email, password } = req.body as {
    username?: string;
    email?: string;
    password?: string;
  };

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const armyNumber = `ARMY-${year}-${randomNum}`;

    const newUser = await User.create({
      armyNumber,
      username,
      email,
      passwordHash,
      role: "USER",
    });

    const user = {
      id: newUser._id,
      armyNumber: newUser.armyNumber,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    };

    setAuthCookie(res, { userId: String(user.id), role: user.role });
    return res.json(user);
  } catch (e: unknown) {
    console.error("Signup error:", e);
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: unknown }).code === 11000
    ) {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    return res.status(500).json({ error: "Internal error" });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────

router.post("/login", async (req: Request, res: Response) => {
  console.log("BODY OF LOGIN :",req.body)
  const { usernameOrEmail, password } = req.body as {
    usernameOrEmail?: string;
    password?: string;
  };

  console.log("🔐 Login attempt:", {
    usernameOrEmail: usernameOrEmail?.substring(0, 20) + "...",
    hasPassword: !!password,
  });

  if (!usernameOrEmail || !password) {
    console.log("❌ Login failed: Missing fields");
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    console.log("🔍 Querying database for user...");

    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });

    if (!user) {
      console.log("❌ Login failed: User not found");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log(`✅ User found: ${user.username} (${user.role})`);

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      console.log("❌ Login failed: Invalid password");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("✅ Login successful, setting auth cookie");
    setAuthCookie(res, { userId: String(user._id), role: user.role });

    return res.json({
      id: user._id,
      armyNumber: user.armyNumber,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (e: unknown) {
    console.error("❌ Login exception:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return res.status(500).json({ error: "Internal error", details: message });
  }
});

// ─── Logout ───────────────────────────────────────────────────────────────────

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token", {
    path: "/",
    secure: true,
    sameSite: "none",
  });
  res.json({ ok: true });
});

// ─── Me ───────────────────────────────────────────────────────────────────────

router.get("/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = req.auth;
    console.log("🔍 /api/me called for userId:", auth.userId);

    const isProduction = process.env.NODE_ENV === "production";

    const user = await User.findById(auth.userId).select(
      "armyNumber username email role createdAt"
    );

    if (!user) {
      console.error("❌ /api/me: User not found for userId:", auth.userId);
      res.clearCookie("token", {
        path: "/",
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
      });
      return res.status(401).json({ error: "Unauthorized", details: "User not found" });
    }

    console.log("✅ /api/me successful:", {
      id: user._id,
      username: user.username,
      role: user.role,
    });

    return res.json({
      id: user._id,
      armyNumber: user.armyNumber,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (e: unknown) {
    console.error("❌ /api/me exception:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return res.status(500).json({ error: "Internal error", details: message });
  }
});

// ─── Admin Stats ──────────────────────────────────────────────────────────────

router.get(
  "/admin/stats",
  requireAuth,
  requireRole("ADMIN"),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        totalAdmins,
        totalRegularUsers,
        usersThisMonth,
        usersThisWeek,
        recentRegistrations,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "ADMIN" }),
        User.countDocuments({ role: "USER" }),
        User.countDocuments({ createdAt: { $gte: thisMonth } }),
        User.countDocuments({ createdAt: { $gte: thisWeek } }),
        User.find()
          .select("username email role createdAt")
          .sort({ createdAt: -1 })
          .limit(10),
      ]);

      const monthlyRegistrations: MonthlyRegistration[] = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const count = await User.countDocuments({
          createdAt: { $gte: monthStart, $lt: nextMonthStart },
        });

        monthlyRegistrations.push({
          month: monthStart.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          }),
          count,
        });
      }

      const roleDistribution: RoleDistribution = {
        USER: totalRegularUsers,
        ADMIN: totalAdmins,
      };

      const formattedRegistrations: RecentRegistration[] = recentRegistrations.map((u) => ({
        id: u._id,
        username: u.username,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      }));

      res.json({
        totalUsers,
        totalAdmins,
        totalRegularUsers,
        usersThisMonth,
        usersThisWeek,
        recentRegistrations: formattedRegistrations,
        roleDistribution,
        monthlyRegistrations,
      });
    } catch (e: unknown) {
      console.error("Admin stats error:", e);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

// ─── Admin Get All Users ──────────────────────────────────────────────────────

router.get(
  "/admin/users",
  requireAuth,
  requireRole("ADMIN"),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await User.find()
        .select("username email role createdAt")
        .sort({ createdAt: -1 });

      if (!users || users.length === 0) return res.json([]);

      const userIds = users.map((u) => u._id);
      const profiles = await UserProfile.find({ userId: { $in: userIds } });
      const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

      const transformedUsers = users.map((user) => {
        const profile = profileMap.get(user._id.toString());
        return {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          profile: profile
            ? {
                personalDetails: profile.personalDetails,
                family: profile.family,
                education: profile.education,
                medical: profile.medical,
                others: profile.others,
                leaveData: profile.leaveData,
                salaryData: profile.salaryData,
                documents: profile.documents,
                updatedAt: profile.updatedAt,
              }
            : null,
        };
      });

      return res.json(transformedUsers);
    } catch (e: unknown) {
      console.error("Get users error:", e);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

// ─── Admin Get Single User ────────────────────────────────────────────────────

router.get(
  "/admin/users/:userId",
  requireAuth,
  requireRole("ADMIN"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId).select("username email role createdAt");
      if (!user) return res.status(404).json({ error: "User not found" });

      const profile = await UserProfile.findOne({ userId });

      return res.json({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        profile: profile
          ? {
              personalDetails: profile.personalDetails,
              family: profile.family,
              education: profile.education,
              medical: profile.medical,
              others: profile.others,
              leaveData: profile.leaveData,
              salaryData: profile.salaryData,
              documents: profile.documents,
              updatedAt: profile.updatedAt,
            }
          : null,
      });
    } catch (e: unknown) {
      console.error("Get user error:", e);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

// ─── Update Army Number ───────────────────────────────────────────────────────

router.put(
  "/update-army-number",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const { armyNumber } = req.body as { armyNumber?: string };

    if (!armyNumber) {
      return res.status(400).json({ error: "Army number is required" });
    }

    try {
      const existingUser = await User.findOne({
        armyNumber,
        _id: { $ne: req.auth.userId },
      });

      if (existingUser) {
        return res.status(409).json({ error: "Army number already exists" });
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.auth.userId,
        { armyNumber },
        { new: true }
      ).select("armyNumber username email role");

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({
        id: updatedUser._id,
        armyNumber: updatedUser.armyNumber,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    } catch (e: unknown) {
      console.error("Update army number error:", e);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

// ─── Ping Routes ──────────────────────────────────────────────────────────────

router.get(
  "/admin/ping",
  requireAuth,
  requireRole("ADMIN"),
  (_req: AuthenticatedRequest, res: Response) => res.json({ ok: true, scope: "admin" })
);

router.get(
  "/user/ping",
  requireAuth,
  requireRole("USER"),
  (_req: AuthenticatedRequest, res: Response) => res.json({ ok: true, scope: "user" })
);

export default router;
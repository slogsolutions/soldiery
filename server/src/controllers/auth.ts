import { Request, Response } from "express";
import { User } from "../models/User.js";
import { AuthRequest } from "../middlewares/auth.js";

// ─── Login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { armyNumber, password } = req.body;

    if (!armyNumber || !password) {
      res.status(400).json({
        success: false,
        message: "Army number and password are required",
      });
      return;
    }

    // fetch user — must include password for comparison
    const user = await User.findOne({ armyNumber }).select("+password");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // check status BEFORE password comparison
    if (user.status === "pending") {
      res.status(403).json({
        success: false,
        message: "Your account is pending approval from manager",
      });
      return;
    }

    if (user.status === "inactive") {
      res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
      });
      return;
    }

    // now compare password
    const isValidUser = await user.comparePassword(password);
    if (!isValidUser) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    const token = user.getJWT();

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: user._id,
        name: user.name,
        role: user.role,
        armyNumber: user.armyNumber,
        rank: user.rank,
        unit: user.unit,
        status: user.status,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Logout ────────────────────────────────────────────────────────────────
export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

// ─── Get current user ──────────────────────────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select("-password");
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    res.status(200).json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

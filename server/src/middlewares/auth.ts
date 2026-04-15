import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    manager?: string;
  };
}

// ─────────────────────────────────────────
// PROTECT MIDDLEWARE
// ─────────────────────────────────────────
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // get token
    if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Not authorized, no token",
      });
      return;
    }

    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
      manager?: string;
    };

    // fetch user (for status check)
    const user = await User.findById(decoded.id).select("status manager");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (user.status === "inactive") {
      res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
      return;
    }

    // attach user to request
    req.user = {
      id: user._id.toString(),
      role: decoded.role,
      manager: user.manager?.toString(), // 🔥 FIXED
    };

    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: "Token invalid or expired",
    });
  }
};

// ─────────────────────────────────────────
// ROLE RESTRICTION
// ─────────────────────────────────────────
export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Only ${roles.join(", ")} allowed`,
      });
      return;
    }
    next();
  };
};
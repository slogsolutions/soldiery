import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    name: string;
    armyNumber?: string;
  };
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      res
        .status(401)
        .json({ success: false, message: "Not authorized, no token" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
      name: string;
      armyNumber?: string;
    };

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    if (user.status === "inactive") {
      res.status(403).json({ success: false, message: "Account is inactive" });
      return;
    }

    if (user.status === ("pending" as any)) {
      res
        .status(403)
        .json({ success: false, message: "Account pending manager approval" });
      return;
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      name: decoded.name,
      armyNumber: decoded.armyNumber,
    };

    next();
  } catch (err) {
    res
      .status(401)
      .json({ success: false, message: "Token invalid or expired" });
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Only ${roles.join(", ")} can perform this action`,
      });
      return;
    }
    next();
  };
};

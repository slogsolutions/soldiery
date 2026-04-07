import { Request, Response, NextFunction } from "express";


export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    role: string;
  };
}


export type Role = "USER" | "ADMIN" | "MANAGER";


export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  armyNumber?: string;
  createdAt: string;
}


export interface UserProfile {
  id: string;
  userId: string;
  personalDetails?: any;
  family?: any;
  education?: any;
  medical?: any;
  others?: any;
  leaveData?: any;
  salaryData?: any;
  documents?: any;
  updatedAt: string;
}


export type RequestType = "LEAVE" | "OUTPASS" | "SALARY" | "PROFILE_UPDATE";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface RequestData {
  id: string;
  type: RequestType;
  status: RequestStatus;
  data: any;
  requesterId: string;
  adminRemark?: string;
  managerResponse?: string;
  createdAt: string;
  updatedAt: string;
}


export type AuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void;

export type RoleMiddleware = (
  role: string
) => (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void;
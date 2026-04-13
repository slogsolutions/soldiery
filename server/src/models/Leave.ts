import mongoose, { Schema, model, Document } from "mongoose";

export type LeaveStatus =
  | "pending_manager"
  | "pending_admin"
  | "approved"
  | "rejected_by_manager"
  | "rejected_by_admin";

export interface ILeave extends Document {
  soldier: mongoose.Types.ObjectId;
  reason: string;
  startDate: Date;
  endDate: Date;
  originalDays: number;  // set on creation — never touched again, always soldier's first ask
  finalDays: number;     // current approved days — freely modifiable by manager or admin
  status: LeaveStatus;
  managerNote?: string;
  adminNote?: string;
  modifiedByManager: boolean;
  modifiedByAdmin: boolean;
  reviewedBy?: mongoose.Types.ObjectId;  // manager who reviewed
  approvedBy?: mongoose.Types.ObjectId;  // admin who approved/rejected
  createdAt?: Date;
  updatedAt?: Date;
}

const leaveSchema = new Schema<ILeave>(
  {
    soldier: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    originalDays: { type: Number, required: true },
    finalDays: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "pending_manager",
        "pending_admin",
        "approved",
        "rejected_by_manager",
        "rejected_by_admin",
      ],
      default: "pending_manager",
    },
    managerNote: { type: String },
    adminNote: { type: String },
    modifiedByManager: { type: Boolean, default: false },
    modifiedByAdmin: { type: Boolean, default: false },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Leave = mongoose.models.Leave || model<ILeave>("Leave", leaveSchema);
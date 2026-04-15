import mongoose, { Schema, model, Document } from "mongoose";

export type LeaveStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "approved_by_manager";

export interface ILeave extends Document {
  soldier: mongoose.Types.ObjectId;
  manager: mongoose.Types.ObjectId;
  reason: string;
  startDate: Date;
  endDate: Date;
  originalDays: number;
  finalDays: number;
  status: LeaveStatus;
  managerNote?: string;
  adminNote?: string;
  managerId?: mongoose.Types.ObjectId;
  adminId?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const leaveSchema = new Schema<ILeave>(
  {
    soldier: { type: Schema.Types.ObjectId, ref: "User", required: true },
    manager: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: any, value: Date): boolean {
          return value >= this.startDate;
        },
        message: "End date must be after start date",
      },
    },
    originalDays: { type: Number, required: true },
    finalDays: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved_by_manager", "approved", "rejected"],
      default: "pending",
    },
    managerNote: String,
    adminNote: String,
    managerId: { type: Schema.Types.ObjectId, ref: "User" },
    adminId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const Leave =
  mongoose.models.Leave || model<ILeave>("Leave", leaveSchema);
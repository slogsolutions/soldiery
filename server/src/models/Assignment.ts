import mongoose, {
  Document,
  Schema,
  model,
  Types,
  StringQueryTypeCasting,
} from "mongoose";

export type AssignmentStatus =
  | "upcoming"
  | "active"
  | "pending_review"
  | "completed"
  | "rejected";

export type AssignmentPriority = "low" | "medium" | "high";

export interface IAssignment extends Document {
  soldier: Types.ObjectId;
  task: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: AssignmentStatus;
  createdBy: "manager" | "soldier";
  // manager extra fields
  assignedBy?: Types.ObjectId;
  notes?: string;
  priority?: AssignmentPriority;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    soldier: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "active", "pending_review", "completed", "rejected"],
      default: "upcoming",
    },
    createdBy: {
      type: String,
      enum: ["manager", "soldier"],
      required: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    notes: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    location: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

export const Assignment =
  mongoose.models.Assignment ||
  model<IAssignment>("Assignment", assignmentSchema);

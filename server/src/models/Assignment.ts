import mongoose, { Schema, model, Types } from "mongoose";

export type AssignmentPriority = "low" | "medium" | "high";

export interface IAssignment {
  soldier: Types.ObjectId;
  task: Types.ObjectId;
  manager: Types.ObjectId;

  startTime: Date;
  endTime: Date;

  notes?: string;
  priority?: AssignmentPriority;
  location?: string;

  createdAt?: Date;
  updatedAt?: Date;
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

    manager: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: any, value: Date) {
          return value > this.startTime;
        },
        message: "End time must be after start time",
      },
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
  { timestamps: true }
);

// 🔥 Index for performance (important for queries)
assignmentSchema.index({ manager: 1, soldier: 1, startTime: 1 });

export const Assignment =
  mongoose.models.Assignment ||
  model<IAssignment>("Assignment", assignmentSchema);
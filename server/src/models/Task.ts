import mongoose ,{ Schema, model, Document, Types } from "mongoose";

export interface ITask extends Document {
  title: string;
  description?: string;
  createdBy: Types.ObjectId;
  manager : Types.ObjectId;
  isActive?: Boolean;
  createdAt:Date;
  updatedAt:Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    manager:{
      type:Schema.Types.ObjectId,
      ref:"User",
      required:true,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export const Task = mongoose.models.Task || model<ITask>("Task", taskSchema);

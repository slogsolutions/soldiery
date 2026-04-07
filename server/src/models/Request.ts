import mongoose, { Document, Schema, Types } from "mongoose";

export interface IRequest extends Document {
  type: string;
  data: Record<string, unknown>;
  status: string;
  requesterId: Types.ObjectId;
  adminRemark?: string;
  managerResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RequestSchema = new Schema<IRequest>(
  {
    type: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      default: "PENDING",
    },
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adminRemark: {
      type: String,
      default: null,
    },
    managerResponse: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

const Request = mongoose.model<IRequest>("Request", RequestSchema);

export default Request;
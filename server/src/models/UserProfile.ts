import mongoose, { Document, Schema, Types } from "mongoose";

export interface IUserProfile extends Document {
  userId: Types.ObjectId;
  personalDetails?: Record<string, unknown>;
  family?: Record<string, unknown>;
  education?: Record<string, unknown>;
  medical?: Record<string, unknown>;
  others?: Record<string, unknown>;
  leaveData?: Record<string, unknown>;
  salaryData?: Record<string, unknown>;
  documents?: Record<string, unknown>;
  updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one profile per user
    },
    personalDetails: {
      type: Schema.Types.Mixed,
      default: null,
    },
    family: {
      type: Schema.Types.Mixed,
      default: null,
    },
    education: {
      type: Schema.Types.Mixed,
      default: null,
    },
    medical: {
      type: Schema.Types.Mixed,
      default: null,
    },
    others: {
      type: Schema.Types.Mixed,
      default: null,
    },
    leaveData: {
      type: Schema.Types.Mixed,
      default: null,
    },
    salaryData: {
      type: Schema.Types.Mixed,
      default: null,
    },
    documents: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: "updatedAt" },
  }
);

const UserProfile = mongoose.model<IUserProfile>(
  "UserProfile",
  UserProfileSchema
);

export default UserProfile;
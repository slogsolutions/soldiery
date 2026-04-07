import mongoose, { Document, Schema } from "mongoose";

export type Role = "USER" | "ADMIN" | "MANAGER";

export interface IUser extends Document {
  armyNumber?: string;
  username: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    armyNumber: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values with unique index
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN", "MANAGER"],
      default: "USER",
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  }
);

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
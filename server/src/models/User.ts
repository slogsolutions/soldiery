import mongoose, { Schema, model, Document } from "mongoose";
import  Jwt  from "jsonwebtoken";
import bcrypt from "bcryptjs"

export type UserRole = "admin" | "manager" | "soldier";

export interface IUser extends Document {
  name: string;
  role: UserRole;
  armyNumber?: string;
  rank?: string;
  unit?: string;
  manager?:mongoose.Types.ObjectId;
  status?: "pending" | "active" | "on_leave" | "inactive";
  password?: string;        
  createdAt?: Date;
  updatedAt?: Date;
  getJWT(): string;
  hasRole(role: UserRole | UserRole[]): boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "manager", "soldier"],
      required: true,
    },
    armyNumber: { type: String, unique: true, sparse: true },
    rank: String,
    unit: String,

      manager: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function (this: IUser) {
        return this.role === "soldier"; // only soldiers must have manager
      },
    },
    
    status: {
      type: String,
      enum: ["pending","active", "on_leave", "inactive"],
      default: "pending",
    },
    password :{ type: String, required:true, select: false },
  },
  { timestamps: true }
);

//Instance Methods---------

// Generate JWT token
userSchema.methods.getJWT = function(this: IUser): string {
  const payload = {
    id: this._id,
    name: this.name,
    role: this.role,
    armyNumber: this.armyNumber,
  };
  return Jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn:"7d",
  });
};

// Check if user has one of the given roles
userSchema.methods.hasRole = function(this: IUser, roles: UserRole | UserRole[]): boolean {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return allowed.includes(this.role);
};

// Compare password 

userSchema.methods.comparePassword = async function(this: IUser, candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User =
  mongoose.models.User ||
  model<IUser>("User", userSchema);
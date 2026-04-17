import mongoose from "mongoose";
import { User } from "./src/models/User.js";
import { Leave } from "./src/models/Leave.js";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || "mongodb+srv://parking_db_user:Slog12@cluster0.lq6jd76.mongodb.net/?appName=Cluster0";

const seedLeaves = async () => {
  try {
    await mongoose.connect(DATABASE_URL);
    console.log("Connected to MongoDB for Leave Seeding.");

    const manager = await User.findOne({ role: "manager" });
    if (!manager) {
      console.log("No manager found.");
      process.exit(1);
    }

    const soldiers = await User.find({ role: "soldier", manager: manager._id }).limit(2);
    if (soldiers.length < 2) {
      console.log("Not enough soldiers to apply leaves. Ensure at least 2 soldiers exist.");
      process.exit(1);
    }

    // Delete existing leaves just in case to prevent duplicates
    await Leave.deleteMany({ manager: manager._id });

    const now = new Date();
    
    // Soldier 1: On Leave starting 2 days ago, ending 5 days from now
    const start1 = new Date(now);
    start1.setDate(now.getDate() - 2);
    const end1 = new Date(now);
    end1.setDate(now.getDate() + 5);

    // Soldier 2: On Leave starting yesterday, ending 3 days from now
    const start2 = new Date(now);
    start2.setDate(now.getDate() - 1);
    const end2 = new Date(now);
    end2.setDate(now.getDate() + 3);

    const leaves = [
      {
        soldier: soldiers[0]._id,
        manager: manager._id,
        reason: "Family Medical Emergency",
        startDate: start1,
        endDate: end1,
        originalDays: 7,
        finalDays: 7,
        status: "approved",
      },
      {
        soldier: soldiers[1]._id,
        manager: manager._id,
        reason: "Annual Leave",
        startDate: start2,
        endDate: end2,
        originalDays: 4,
        finalDays: 4,
        status: "approved_by_manager", 
      }
    ];

    await Leave.insertMany(leaves);
    console.log(`Created 2 active leaves for ${soldiers[0].name} and ${soldiers[1].name}.`);

    process.exit(0);
  } catch (error) {
    console.error("Error Seeding Leaves:", error);
    process.exit(1);
  }
};

seedLeaves();

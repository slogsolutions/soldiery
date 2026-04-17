import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "./src/models/User.js";
import { Leave } from "./src/models/Leave.js";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL! 
if(!DATABASE_URL) {
  console.error("DATABASE_URL not set in environment variables.");
}

const seed = async () => {
  try {
    await mongoose.connect(DATABASE_URL);
    console.log("Connected to MongoDB.");

    // Find the first manager
    const manager = await User.findOne({ role: "manager" });
    if (!manager) {
      console.log("No manager found. Create a manager first.");
      process.exit(1);
    }
    console.log("Found Manager:", manager.name);

    const passwordHash = await bcrypt.hash("Password123!", 10);

    // Create 4 soldiers
    const soldiersArray = [
      {
        name: "Rifleman Arjun Thakur",
        armyNumber: "SLD-5097",
        password: passwordHash,
        rank: "Rifleman",
        unit: "Assam Rifles",
        role: "soldier",
        manager: manager._id,
        status: "active",
      },
      {
        name: "Sepoy Manoj Tiwari",
        armyNumber: "SLD-5098",
        password: passwordHash,
        rank: "Sepoy",
        unit: "Bihar Regiment",
        role: "soldier",
        manager: manager._id,
        status: "active",
      },
      {
        name: "Subedar Major RK Singh",
        armyNumber: "SLD-5099",
        password: passwordHash,
        rank: "Subedar Major",
        unit: "Kumaon Regiment",
        role: "soldier",
        manager: manager._id,
        status: "active",
      },
      {
        name: "Lance Naik Abhinav",
        armyNumber: "SLD-5100",
        password: passwordHash,
        rank: "Lance Naik",
        unit: "Garhwal Rifles",
        role: "soldier",
        manager: manager._id,
        status: "active",
      }
    ]; 

    const createdSoldiers = await User.insertMany(soldiersArray);
    console.log(`Created ${createdSoldiers.length} soldiers.`);

    // Create leaves for 2 of them
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
        soldier: createdSoldiers[0]._id,
        manager: manager._id,
        reason: "Family Medical Emergency",
        startDate: start1,
        endDate: end1,
        originalDays: 7,
        finalDays: 7,
        status: "approved",
      },
      {
        soldier: createdSoldiers[1]._id,
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
    console.log("Created 2 active leaves.");

    console.log("Seeding Database Complete!");
    process.exit(0);

  } catch (error) {
    console.error("Error Seeding:", error);
    process.exit(1);
  }
};

seed();

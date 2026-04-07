import "dotenv/config";
import mongoose from "mongoose";

const test = async () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ DATABASE_URL is not set in .env");
    process.exit(1);
  }

  try {
    console.log("🔍 Connecting to MongoDB...");
    await mongoose.connect(connectionString);
    console.log("✅ MongoDB connected successfully!");
    await mongoose.disconnect();
    console.log("🔌 Disconnected cleanly");
  } catch (error) {
    console.error("❌ Connection failed:", error);
    process.exit(1);
  }
};

test();
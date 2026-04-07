import "dotenv/config";
import mongoose from "mongoose";

const dbConnection = async (): Promise<void> => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  try {
    await mongoose.connect(connectionString);
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection error:", error);
    throw error;
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.disconnect();
  console.log("🔌 Database disconnected on app termination");
  process.exit(0);
});

export default dbConnection;
import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config()

const dbConnection = async (): Promise<void> => {

  try {
    await mongoose.connect(
      process.env.DATABASE_URL  || ""    );
      
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};

export default dbConnection;
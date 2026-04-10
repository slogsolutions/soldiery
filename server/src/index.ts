import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dbConnection from "./config/dbconnection.js";
import authRoutes from "./routes/auth.js";
import managerRoutes from "./routes/manager.js";
import soldierRoutes from "./routes/soldier.js";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/soldier", soldierRoutes);

// health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

const port = process.env.PORT || 5000;

dbConnection()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err: Error) => {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  });
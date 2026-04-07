import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import managerRoutes from "./routes/manager.js";
import requestsRoutes from "./routes/requests.js";
import dbConnection from "../src/lib/dbConnection.js";

const app = express();
const PORT = Number(process.env.PORT || 5000);
const NODE_ENV = process.env.NODE_ENV || "development";

app.use(express.json());
app.use(cookieParser());

// Required for correct trust of X-Forwarded-* headers when behind proxies (Render/Heroku/Vercel)
app.set("trust proxy", 1);

// CORS configuration
// TODO: In production, replace 'origin: true' with specific allowed origins for security
const corsOptions = {
  origin: true, // Allow all origins temporarily - replace with specific domains in production
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/api/health", async (_req, res) => {
  try {
    console.log("🔍 Health check: Testing database connection...");

    const isConnected = mongoose.connection.readyState === 1;

    if (!isConnected) {
      console.error("❌ Health check failed: Database not connected");
      return res.status(500).json({ ok: false, error: "Database not connected" });
    }

    console.log("✅ Health check passed");
    res.json({ ok: true, database: "connected" });
  } catch (e: any) {
    console.error("❌ Health check exception:", e);
    res.status(500).json({ ok: false, error: e?.message || "Unknown error" });
  }
});

// ─── Test Route ───────────────────────────────────────────────────────────────

app.get("/api/test", (req, res) => {
  res.json({
    message: "API is working!",
    timestamp: new Date().toISOString(),
    headers: req.headers,
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/api", authRoutes);
app.use("/api", profileRoutes);
app.use("/api", managerRoutes);
app.use("/api", requestsRoutes);

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, async () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    await dbConnection();
  } catch (error) {
    console.error(
      "⚠️  WARNING: Database connection failed! The server will start but API calls may fail."
    );
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});
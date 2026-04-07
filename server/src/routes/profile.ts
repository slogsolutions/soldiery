import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { AuthenticatedRequest } from "../types/index.js";
import UserProfile from "../models/UserProfile.js";

// Extend AuthenticatedRequest to include multer's file field
interface MulterRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
}

const router = express.Router();

// ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Multer Config ────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as AuthenticatedRequest).auth.userId;
    const section = req.body.section;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${userId}_${section}_${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 300 * 1024 }, // 300KB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// ─── Helper ───────────────────────────────────────────────────────────────────

async function upsertProfile(userId: string, update: Record<string, any>) {
  return UserProfile.findOneAndUpdate(
    { userId },
    { ...update, updatedAt: new Date() },
    { upsert: true, new: true }
  );
}

// ─── Get Profile ──────────────────────────────────────────────────────────────

router.get("/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId;
    const profile = await UserProfile.findOne({ userId });
    res.json(profile || {});
  } catch (e) {
    console.error("Get profile error:", e);
    res.status(500).json({ error: "Internal error" });
  }
});

// ─── Update Personal Details ──────────────────────────────────────────────────

router.put("/personal", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId;
    await upsertProfile(userId, { personalDetails: req.body });
    res.json({ ok: true });
  } catch (e) {
    console.error("Update personal details error:", e);
    res.status(500).json({ error: "Internal error" });
  }
});

// ─── Update Family Details ────────────────────────────────────────────────────

router.put("/family", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId;
    await upsertProfile(userId, { family: req.body });
    res.json({ ok: true });
  } catch (e) {
    console.error("Update family details error:", e);
    res.status(500).json({ error: "Internal error" });
  }
});

// ─── Update Education Details ─────────────────────────────────────────────────

router.put("/education", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId;
    await upsertProfile(userId, { education: req.body });
    res.json({ ok: true });
  } catch (e) {
    console.error("Update education details error:", e);
    res.status(500).json({ error: "Internal error" });
  }
});

// ─── Update Medical Details ───────────────────────────────────────────────────

router.put("/medical", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId;
    await upsertProfile(userId, { medical: req.body });
    res.json({ ok: true });
  } catch (e) {
    console.error("Update medical details error:", e);
    res.status(500).json({ error: "Internal error" });
  }
});

// ─── Update Others Details ────────────────────────────────────────────────────

router.put("/others", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId;
    await upsertProfile(userId, { others: req.body });
    res.json({ ok: true });
  } catch (e) {
    console.error("Update others details error:", e);
    res.status(500).json({ error: "Internal error" });
  }
});

// ─── Upload Document ──────────────────────────────────────────────────────────

router.post(
  "/documents",
  requireAuth,
  upload.single("file"),
  async (req: MulterRequest, res) => {
    try {
      const userId = req.auth.userId;
      const section = req.body.section;
      const file = req.file;

      if (!file) return res.status(400).json({ error: "No file uploaded" });
      if (!section) return res.status(400).json({ error: "Section is required" });

      const profile = await UserProfile.findOne({ userId }).select("documents");
      const currentDocuments = (profile?.documents as Record<string, any>) || {};

      const newDocument = {
        name: file.originalname,
        filename: file.filename,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        path: file.path,
      };

      const updatedDocuments = { ...currentDocuments, [section]: newDocument };
      await upsertProfile(userId, { documents: updatedDocuments });

      res.json({ ok: true, document: newDocument });
    } catch (e) {
      console.error("Upload document error:", e);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

// ─── Remove Document ──────────────────────────────────────────────────────────

router.delete(
  "/documents/:section",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.auth.userId;
      const section = req.params.section;

      const profile = await UserProfile.findOne({ userId }).select("documents");
      if (!profile?.documents)
        return res.status(404).json({ error: "No documents found" });

      const currentDocuments = profile.documents as any;
      const documentToRemove = currentDocuments[section];
      if (!documentToRemove)
        return res.status(404).json({ error: "Document not found" });

      // Remove file from filesystem
      try {
        if (fs.existsSync(documentToRemove.path)) {
          fs.unlinkSync(documentToRemove.path);
        }
      } catch (fileError) {
        console.error("Error removing file:", fileError);
      }

      const updatedDocuments = { ...currentDocuments };
      delete updatedDocuments[section];
      await upsertProfile(userId, { documents: updatedDocuments });

      res.json({ ok: true });
    } catch (e) {
      console.error("Remove document error:", e);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

// ─── Download Document ────────────────────────────────────────────────────────

router.get(
  "/documents/:section",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.auth.userId;
      const section = req.params.section;

      const profile = await UserProfile.findOne({ userId }).select("documents");
      if (!profile?.documents)
        return res.status(404).json({ error: "No documents found" });

      const documents = profile.documents as any;
      const document = documents[section];
      if (!document) return res.status(404).json({ error: "Document not found" });

      if (!fs.existsSync(document.path))
        return res.status(404).json({ error: "File not found" });

      res.download(document.path, document.name);
    } catch (e) {
      console.error("Download document error:", e);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

export default router;
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { AuthenticatedRequest } from "../types/index.js";
import UserProfile from "../models/UserProfile.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MulterRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
}

interface DocumentRecord {
  name: string;
  filename: string;
  size: number;
  uploadedAt: string;
  path: string;
}

type DocumentsMap = Record<string, DocumentRecord>;

// ─── Setup ────────────────────────────────────────────────────────────────────

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Multer Config ────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as AuthenticatedRequest).auth.userId;
    const section = (req as express.Request).body.section as string;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${userId}_${section}_${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 300 * 1024 }, // 300KB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// ─── Helper ───────────────────────────────────────────────────────────────────

async function upsertProfile(userId: string, update: Record<string, unknown>) {
  return UserProfile.findOneAndUpdate(
    { userId },
    { ...update, updatedAt: new Date() },
    { upsert: true, new: true }
  );
}

function isDocumentsMap(value: unknown): value is DocumentsMap {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDocumentRecord(value: unknown): value is DocumentRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    "path" in value &&
    "name" in value &&
    typeof (value as DocumentRecord).path === "string" &&
    typeof (value as DocumentRecord).name === "string"
  );
}

// ─── Get Profile ──────────────────────────────────────────────────────────────

router.get("/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId;
    const profile = await UserProfile.findOne({ userId });
    res.json(profile ?? {});
  } catch (e: unknown) {
    console.error("Get profile error:", e);
    res.status(500).json({ error: "Internal error" });
  }
});

// ─── Update Personal Details ──────────────────────────────────────────────────

router.put("/profile/personal", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId;
    await upsertProfile(userId, { personalDetails: req.body as Record<string, unknown> });
    res.json({ ok: true });
  } catch (e: unknown) {
    console.error("Update personal details error:", e);
    res.status(500).json({ error: "Internal error" });
  }
});

// ─── Update Family Details ────────────────────────────────────────────────────

router.put("/profile/family", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId;
    await upsertProfile(userId, { family: req.body as Record<string, unknown> });
    res.json({ ok: true });
  } catch (e: unknown) {
    console.error("Update family details error:", e);
    res.status(500).json({ error: "Internal error" });
  }
});

// ─── Update Education Details ─────────────────────────────────────────────────

router.put("/profile/education", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId;
    await upsertProfile(userId, { education: req.body as Record<string, unknown> });
    res.json({ ok: true });
  } catch (e: unknown) {
    console.error("Update education details error:", e);
    res.status(500).json({ error: "Internal error" });
  }
});

// ─── Update Medical Details ───────────────────────────────────────────────────

router.put("/profile/medical", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId;
    await upsertProfile(userId, { medical: req.body as Record<string, unknown> });
    res.json({ ok: true });
  } catch (e: unknown) {
    console.error("Update medical details error:", e);
    res.status(500).json({ error: "Internal error" });
  }
});

// ─── Update Others Details ────────────────────────────────────────────────────

router.put("/others", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId;
    await upsertProfile(userId, { others: req.body as Record<string, unknown> });
    res.json({ ok: true });
  } catch (e: unknown) {
    console.error("Update others details error:", e);
    res.status(500).json({ error: "Internal error" });
  }
});

// ─── Upload Document ──────────────────────────────────────────────────────────

router.post(
  "/profile/documents",
  requireAuth,
  upload.single("file"),
  async (req: MulterRequest, res) => {
    try {
      const userId = req.auth.userId;
      const section = req.body.section as string | undefined;
      const file = req.file;

      if (!file) return res.status(400).json({ error: "No file uploaded" });
      if (!section) return res.status(400).json({ error: "Section is required" });

      const profile = await UserProfile.findOne({ userId }).select("documents");
      const rawDocuments: unknown = profile?.documents;
      const currentDocuments: DocumentsMap = isDocumentsMap(rawDocuments)
        ? (rawDocuments as DocumentsMap)
        : {};

      const newDocument: DocumentRecord = {
        name: file.originalname,
        filename: file.filename,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        path: file.path,
      };

      const updatedDocuments: DocumentsMap = { ...currentDocuments, [section]: newDocument };
      await upsertProfile(userId, { documents: updatedDocuments });

      res.json({ ok: true, document: newDocument });
    } catch (e: unknown) {
      console.error("Upload document error:", e);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

// ─── Remove Document ──────────────────────────────────────────────────────────
router.delete(
  "/profile/documents/:section",  // was hardcoded to "/profile/documents/personal"
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.auth.userId;
      const section = req.params.section;

      const profile = await UserProfile.findOne({ userId }).select("documents");
      if (!profile?.documents) {
        return res.status(404).json({ error: "No documents found" });
      }

      const rawDocuments: unknown = profile.documents;
      if (!isDocumentsMap(rawDocuments)) {
        return res.status(500).json({ error: "Invalid documents data" });
      }

      const documentToRemove: unknown = rawDocuments[section];
      if (!isDocumentRecord(documentToRemove)) {
        return res.status(404).json({ error: "Document not found" });
      }

      try {
        if (fs.existsSync(documentToRemove.path)) {
          fs.unlinkSync(documentToRemove.path);
        }
      } catch (fileError: unknown) {
        console.error("Error removing file:", fileError);
      }

      const updatedDocuments: DocumentsMap = { ...rawDocuments };
      delete updatedDocuments[section];
      await upsertProfile(userId, { documents: updatedDocuments });

      res.json({ ok: true });
    } catch (e: unknown) {
      console.error("Remove document error:", e);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

// ─── Download Document ────────────────────────────────────────────────────────
router.get(
  "/profile/documents/:section",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.auth.userId;
      const section = req.params.section;

      const profile = await UserProfile.findOne({ userId }).select("documents");
      if (!profile?.documents) {
        return res.status(404).json({ error: "No documents found" });
      }

      const rawDocuments: unknown = profile.documents;
      if (!isDocumentsMap(rawDocuments)) {
        return res.status(500).json({ error: "Invalid documents data" });
      }

      const document: unknown = rawDocuments[section];
      if (!isDocumentRecord(document)) {
        return res.status(404).json({ error: "Document not found" });
      }

      if (!fs.existsSync(document.path)) {
        return res.status(404).json({ error: "File not found" });
      }

      res.download(document.path, document.name);
    } catch (e: unknown) {
      console.error("Download document error:", e);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

export default router;
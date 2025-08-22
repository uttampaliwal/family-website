import express from "express";

import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  downloadFile,
} from "../controllers/documentController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { csrfProtection } from "../middleware/csrfGenerator.js";
import upload from "../middleware/fileUpload.js";
import path from "path";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all documents
router.get("/", getDocuments);

// Get a single document
router.get("/:id", getDocumentById);

// Create a new document
router.post("/", ...csrfProtection, upload.single("file"), createDocument);

// Update a document
router.put("/:id", ...csrfProtection, updateDocument);

// Delete a document
router.delete("/:id", ...csrfProtection, deleteDocument);

// Share a document
router.post("/:id/share", ...csrfProtection, shareDocument);

// Download a document file
router.get("/:id/download", downloadFile);

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from uploads directory
router.use("/uploads", express.static(path.join(__dirname, "../../uploads")));

export default router;

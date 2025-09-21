import { Request, Response } from "express";
import Document, { IDocument } from "../models/Document";
import User, { IUser } from "../models/User";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { sanitizeLog } from "../utils/logSanitizer";

import { htmlEncode } from "../utils/sanitization";
import { logError } from "../utils/logger";

// Get all documents for the logged-in user
export const getDocuments = async (req: Request, res: Response) => {
  try {
    if (!(req.user as IUser)?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid((req.user as IUser)?.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const documents = await Document.find({
      $or: [
        { owner: String((req.user as IUser)?.id) },
        { sharedWith: String((req.user as IUser)?.id) },
      ],
    })
      .populate("owner", "username name") // Populate owner information
      .populate("sharedWith", "username name") // Populate shared users information
      .sort({ updatedAt: -1 });

    return res.status(200).json(documents);
  } catch (error: unknown) {
    logError(error as Error, "fetch_documents", {
      userId: (req.user as IUser)?.id,
    });
    return res.status(500).json({ message: "Failed to retrieve documents" });
  }
};

// Get a single document by ID
export const getDocumentById = async (req: Request, res: Response) => {
  try {
    if (!(req.user as IUser)?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Verify user exists
    const user = await User.findById<IUser>(String((req.user as IUser)?.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const documentId = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    const sanitizedUserId = String((req.user as IUser)?.id);
    const document = await Document.findOne<IDocument>({
      _id: documentId,
      $or: [{ owner: sanitizedUserId }, { sharedWith: sanitizedUserId }],
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const sanitizedDocument = {
      ...document.toObject(),
      title: htmlEncode(document.title || ""),
      content: htmlEncode(document.content || ""),
    };
    return res.status(200).json(sanitizedDocument);
  } catch (error: unknown) {
    logError(error as Error, "fetch_document", {
      userId: (req.user as IUser)?.id,
      documentId: sanitizeLog(req.params.id || "unknown"),
    });
    return res.status(500).json({ message: "Server error" });
  }
};

interface DocumentCreationData {
  title: string;
  content: string;
  owner: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

// Create a new document
export const createDocument = async (req: Request, res: Response) => {
  try {
    if (!(req.user as IUser)?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Verify user exists
    const user = await User.findById<IUser>(String((req.user as IUser)?.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { title, content } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required" });
    }

    // Sanitize title and content before saving
    const sanitizedTitle = htmlEncode(title);
    const sanitizedContent = htmlEncode(content);

    // Create document object
    const documentData: DocumentCreationData = {
      title: sanitizedTitle,
      content: sanitizedContent,
      owner: (req.user as IUser)?.id,
    };

    if (req.file) {
      const file = req.file as Express.Multer.File;
      const baseUrl =
        process.env.API_BASE_URL ||
        `http://localhost:${process.env.PORT || 3000}`;

      documentData.fileUrl = `${baseUrl}/uploads/${file.filename}`;
      documentData.fileName = file.originalname;
      documentData.fileType = file.mimetype;
      documentData.fileSize = file.size;
    }

    const newDocument = new Document(documentData);
    await newDocument.save();
    return res.status(201).json(newDocument);
  } catch (error: unknown) {
    logError(error as Error, "create_document", {
      userId: (req.user as IUser)?.id,
      title: sanitizeLog(req.body.title || "unknown"),
    });
    return res.status(500).json({ message: "Server error" });
  }
};

// Update a document
export const updateDocument = async (req: Request, res: Response) => {
  try {
    if (
      !(req.user as IUser)?.id ||
      !mongoose.Types.ObjectId.isValid((req.user as IUser)?.id)
    ) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    const { title, content } = req.body;

    // Find document and verify ownership
    const document = await Document.findOne<IDocument>({
      _id: String(req.params.id),
      owner: String((req.user as IUser)?.id),
    });
    if (!document) {
      return res.status(404).json({
        message: "Document not found or you do not have permission to edit",
      });
    }

    document.title = title ? htmlEncode(title) : document.title;
    document.content = content ? htmlEncode(content) : document.content;

    await document.save();
    return res.status(200).json(document);
  } catch (error: unknown) {
    logError(error as Error, "update_document", {
      userId: (req.user as IUser)?.id,
      documentId: sanitizeLog(req.params.id || "unknown"),
    });
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete a document
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    if (
      !(req.user as IUser)?.id ||
      !mongoose.Types.ObjectId.isValid((req.user as IUser)?.id)
    ) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    const document = await Document.findOneAndDelete<IDocument>({
      _id: req.params.id,
      owner: String((req.user as IUser)?.id),
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found or you do not have permission to delete",
      });
    }

    return res.status(200).json({ message: "Document deleted successfully" });
  } catch (error: unknown) {
    logError(error as Error, "delete_document", {
      userId: (req.user as IUser)?.id,
      documentId: sanitizeLog(req.params.id || "unknown"),
    });
    return res.status(500).json({ message: "Server error" });
  }
};

// Download a document file
export const downloadFile = async (req: Request, res: Response) => {
  try {
    if (!(req.user as IUser)?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    const document = await Document.findOne<IDocument>({
      _id: req.params.id,
      $or: [
        { owner: String((req.user as IUser)?.id) },
        { sharedWith: String((req.user as IUser)?.id) },
      ],
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (!document.fileUrl) {
      return res
        .status(404)
        .json({ message: "No file associated with this document" });
    }

    // Extract filename from fileUrl
    const filename = path.basename(document.fileUrl);
    if (!filename) {
      return res.status(404).json({ message: "File not found" });
    }

    const filePath = path.join(__dirname, "../../uploads", filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    // Set headers for file download
    const sanitizedFileName = String(document.fileName || "download")
      .substring(0, 255)
      .replace(/[^a-zA-Z0-9_.-]/g, "_");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${htmlEncode(sanitizedFileName)}"`,
    );
    res.setHeader(
      "Content-Type",
      document.fileType || "application/octet-stream",
    );

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    return;
  } catch (error: unknown) {
    logError(error as Error, "download_file", {
      userId: (req.user as IUser)?.id,
      documentId: sanitizeLog(req.params.id || "unknown"),
    });
    return res.status(500).json({ message: "Server error" });
  }
};

// Share a document with another user
export const shareDocument = async (req: Request, res: Response) => {
  try {
    if (
      !(req.user as IUser)?.id ||
      !mongoose.Types.ObjectId.isValid((req.user as IUser)?.id)
    ) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { username } = req.body;

    if (!username || typeof username !== "string" || !username.trim()) {
      return res.status(400).json({ message: "Username is required" });
    }

    // Validate and sanitize username input to prevent NoSQL injection
    const sanitizedUsername = String(username).trim();

    // Additional validation to prevent NoSQL injection using literal regex
    const SAFE_USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,30}$/;
    if (!SAFE_USERNAME_PATTERN.test(sanitizedUsername)) {
      return res.status(400).json({ message: "Invalid username format" });
    }

    // Verify target user exists using parameterized query to prevent NoSQL injection
    const targetUser = await User.findOne<IUser>({
      username: { $eq: sanitizedUsername },
    });
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    // Prevent sharing with yourself
    if (targetUser._id.toString() === String((req.user as IUser)?.id)) {
      return res
        .status(400)
        .json({ message: "Cannot share document with yourself" });
    }

    const documentId = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    const document = await Document.findOne<IDocument>({
      _id: String(documentId),
      owner: String((req.user as IUser)?.id),
    });

    if (!document) {
      return res
        .status(404)
        .json({ message: "Document not found or you do not have permission" });
    }

    // Add user to sharedWith if not already there
    const targetUserId = targetUser._id;
    const alreadyShared = document.sharedWith.some(
      (id) => id.toString() === targetUserId.toString(),
    );

    if (!alreadyShared) {
      document.sharedWith.push(targetUserId as mongoose.Types.ObjectId);
      await document.save();
    }

    return res.status(200).json({ message: "Document shared successfully" });
  } catch (error: unknown) {
    logError(error as Error, "share_document", {
      userId: (req.user as IUser)?.id,
      documentId: sanitizeLog(req.params.id || "unknown"),
    });
    return res.status(500).json({ message: "Server error" });
  }
};

import request from "supertest";
import { Express } from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createTestApp } from "../helpers/testApp.js";
import { User } from "../../models/User.js";
import { Document } from "../../models/Document.js";
import bcrypt from "bcryptjs";

describe("Documents API Integration Tests", () => {
  let app: Express;
  let mongoServer: MongoMemoryServer;
  let authToken: string;
  let userId: string;
  let documentId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    app = createTestApp();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Document.deleteMany({});

    // Create and authenticate a test user
    const hashedPassword = await bcrypt.hash("TestPassword123!", 12);
    const user = await User.create({
      username: "testuser",
      email: "test@example.com",
      password: hashedPassword,
      firstName: "Test",
      lastName: "User",
      dateOfBirth: new Date("1990-01-01"),
      isEmailVerified: true,
      termsAccepted: true,
    });

    userId = user._id.toString();

    // Login to get auth token
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "TestPassword123!",
    });

    authToken = loginResponse.body.accessToken;

    // Create a test document
    const document = await Document.create({
      title: "Test Document",
      content: "This is test content",
      author: userId,
      isPublic: false,
    });

    documentId = document._id.toString();
  });

  describe("GET /api/documents", () => {
    it("should get user documents when authenticated", async () => {
      const response = await request(app)
        .get("/api/documents")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("documents");
      expect(Array.isArray(response.body.documents)).toBe(true);
      expect(response.body.documents).toHaveLength(1);
      expect(response.body.documents[0]).toHaveProperty(
        "title",
        "Test Document",
      );
    });

    it("should reject unauthenticated requests", async () => {
      await request(app).get("/api/documents").expect(401);
    });

    it("should filter documents by search query", async () => {
      // Create another document
      await Document.create({
        title: "Another Document",
        content: "Different content",
        author: userId,
        isPublic: false,
      });

      const response = await request(app)
        .get("/api/documents?search=test")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.documents).toHaveLength(1);
      expect(response.body.documents[0]).toHaveProperty(
        "title",
        "Test Document",
      );
    });
  });

  describe("POST /api/documents", () => {
    it("should create new document successfully", async () => {
      const documentData = {
        title: "New Document",
        content: "This is new content",
        isPublic: true,
      };

      const response = await request(app)
        .post("/api/documents")
        .set("Authorization", `Bearer ${authToken}`)
        .send(documentData)
        .expect(201);

      expect(response.body).toHaveProperty(
        "message",
        "Document created successfully",
      );
      expect(response.body.document).toHaveProperty("title", "New Document");
      expect(response.body.document).toHaveProperty(
        "content",
        "This is new content",
      );
      expect(response.body.document).toHaveProperty("isPublic", true);
      expect(response.body.document).toHaveProperty("author");
    });

    it("should validate required fields", async () => {
      const invalidData = {
        content: "Content without title",
      };

      await request(app)
        .post("/api/documents")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it("should sanitize document content", async () => {
      const maliciousData = {
        title: '<script>alert("xss")</script>Safe Title',
        content: '<img src="x" onerror="alert(1)">Safe content',
      };

      const response = await request(app)
        .post("/api/documents")
        .set("Authorization", `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(201);

      expect(response.body.document.title).not.toContain("<script>");
      expect(response.body.document.content).not.toContain("onerror");
    });
  });

  describe("GET /api/documents/:id", () => {
    it("should get document by ID when user owns it", async () => {
      const response = await request(app)
        .get(`/api/documents/${documentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("document");
      expect(response.body.document).toHaveProperty("title", "Test Document");
      expect(response.body.document).toHaveProperty(
        "content",
        "This is test content",
      );
    });

    it("should reject access to non-existent document", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .get(`/api/documents/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });

    it("should reject access to document owned by another user", async () => {
      // Create another user and document
      const anotherUser = await User.create({
        username: "anotheruser",
        email: "another@example.com",
        password: await bcrypt.hash("Password123!", 12),
        firstName: "Another",
        lastName: "User",
        dateOfBirth: new Date("1995-01-01"),
        isEmailVerified: true,
        termsAccepted: true,
      });

      const anotherDocument = await Document.create({
        title: "Another User Document",
        content: "Private content",
        author: anotherUser._id,
        isPublic: false,
      });

      await request(app)
        .get(`/api/documents/${anotherDocument._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(403);
    });

    it("should allow access to public documents from other users", async () => {
      // Create another user and public document
      const anotherUser = await User.create({
        username: "anotheruser",
        email: "another@example.com",
        password: await bcrypt.hash("Password123!", 12),
        firstName: "Another",
        lastName: "User",
        dateOfBirth: new Date("1995-01-01"),
        isEmailVerified: true,
        termsAccepted: true,
      });

      const publicDocument = await Document.create({
        title: "Public Document",
        content: "Public content",
        author: anotherUser._id,
        isPublic: true,
      });

      const response = await request(app)
        .get(`/api/documents/${publicDocument._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.document).toHaveProperty("title", "Public Document");
    });
  });

  describe("PUT /api/documents/:id", () => {
    it("should update document successfully", async () => {
      const updateData = {
        title: "Updated Title",
        content: "Updated content",
        isPublic: true,
      };

      const response = await request(app)
        .put(`/api/documents/${documentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Document updated successfully",
      );
      expect(response.body.document).toHaveProperty("title", "Updated Title");
      expect(response.body.document).toHaveProperty(
        "content",
        "Updated content",
      );
      expect(response.body.document).toHaveProperty("isPublic", true);
    });

    it("should reject updates to documents owned by other users", async () => {
      // Create another user and document
      const anotherUser = await User.create({
        username: "anotheruser",
        email: "another@example.com",
        password: await bcrypt.hash("Password123!", 12),
        firstName: "Another",
        lastName: "User",
        dateOfBirth: new Date("1995-01-01"),
        isEmailVerified: true,
        termsAccepted: true,
      });

      const anotherDocument = await Document.create({
        title: "Another User Document",
        content: "Private content",
        author: anotherUser._id,
        isPublic: false,
      });

      await request(app)
        .put(`/api/documents/${anotherDocument._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Hacked Title" })
        .expect(403);
    });
  });

  describe("DELETE /api/documents/:id", () => {
    it("should delete document successfully", async () => {
      const response = await request(app)
        .delete(`/api/documents/${documentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Document deleted successfully",
      );

      // Verify document no longer exists
      const document = await Document.findById(documentId);
      expect(document).toBeNull();
    });

    it("should reject deletion of documents owned by other users", async () => {
      // Create another user and document
      const anotherUser = await User.create({
        username: "anotheruser",
        email: "another@example.com",
        password: await bcrypt.hash("Password123!", 12),
        firstName: "Another",
        lastName: "User",
        dateOfBirth: new Date("1995-01-01"),
        isEmailVerified: true,
        termsAccepted: true,
      });

      const anotherDocument = await Document.create({
        title: "Another User Document",
        content: "Private content",
        author: anotherUser._id,
        isPublic: false,
      });

      await request(app)
        .delete(`/api/documents/${anotherDocument._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(403);

      // Verify document still exists
      const document = await Document.findById(anotherDocument._id);
      expect(document).not.toBeNull();
    });
  });
});

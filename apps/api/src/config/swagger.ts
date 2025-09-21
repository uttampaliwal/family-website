import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./environment.js";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Family Portal API",
      version: "0.2.5",
      description:
        "A comprehensive API for the Family Portal application providing user authentication, document management, and family networking features.",
      contact: {
        name: "API Support",
        email: "support@familyportal.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: env.FRONTEND_URL.replace("5173", "3000"),
        description: "Development server",
      },
      {
        url: "https://api.familyportal.com",
        description: "Production server",
      },
    ],
    components: {
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string", description: "Unique user identifier" },
            username: { type: "string", description: "Unique username" },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            firstName: { type: "string", description: "User first name" },
            lastName: { type: "string", description: "User last name" },
            dateOfBirth: {
              type: "string",
              format: "date",
              description: "Date of birth",
            },
            profilePicture: {
              type: "string",
              description: "Profile picture URL",
            },
            bio: { type: "string", description: "User biography" },
            isEmailVerified: {
              type: "boolean",
              description: "Email verification status",
            },
            role: {
              type: "string",
              enum: ["user", "admin"],
              description: "User role",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: [
            "username",
            "email",
            "firstName",
            "lastName",
            "dateOfBirth",
          ],
        },
        Document: {
          type: "object",
          properties: {
            _id: { type: "string", description: "Document identifier" },
            title: { type: "string", description: "Document title" },
            content: { type: "string", description: "Document content" },
            author: { $ref: "#/components/schemas/User" },
            isPublic: {
              type: "boolean",
              description: "Public visibility status",
            },
            tags: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: ["title", "content", "author"],
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string", description: "Error message" },
            error: { type: "string", description: "Error type" },
            details: {
              type: "object",
              description: "Additional error details",
            },
          },
          required: ["message"],
        },
        LoginRequest: {
          type: "object",
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "User email",
            },
            password: { type: "string", description: "User password" },
          },
          required: ["email", "password"],
        },
        RegisterRequest: {
          type: "object",
          properties: {
            username: { type: "string", description: "Unique username" },
            email: {
              type: "string",
              format: "email",
              description: "User email",
            },
            password: { type: "string", description: "Password (min 8 chars)" },
            confirmPassword: {
              type: "string",
              description: "Password confirmation",
            },
            firstName: { type: "string", description: "First name" },
            lastName: { type: "string", description: "Last name" },
            dateOfBirth: {
              type: "string",
              format: "date",
              description: "Date of birth",
            },
            termsAccepted: { type: "boolean", description: "Terms acceptance" },
          },
          required: [
            "username",
            "email",
            "password",
            "confirmPassword",
            "firstName",
            "lastName",
            "dateOfBirth",
            "termsAccepted",
          ],
        },
        AuthResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
            accessToken: { type: "string", description: "JWT access token" },
          },
        },
      },
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        CookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "refreshToken",
        },
        CSRFToken: {
          type: "apiKey",
          in: "header",
          name: "X-XSRF-TOKEN",
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Authentication information is missing or invalid",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        ValidationError: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        NotFoundError: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        ServerError: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: [
    "./src/routes/*.ts", // Path to the API routes
    "./src/controllers/*.ts", // Path to the controllers
  ],
};

export const specs = swaggerJsdoc(options);
export default specs;

# Backend Design Document

This document outlines the architecture, technology stack, and development process for the `apps/api` backend application.

## Table of Contents

1.  [Overview](#1-overview)
2.  [Technology Stack](#2-technology-stack)
3.  [Architecture](#3-architecture)
4.  [Database](#4-database)
5.  [Authentication](#5-authentication)
6.  [API Endpoints](#6-api-endpoints)
7.  [Development Process](#7-development-process)

---

## 1. Overview & Philosophy

The backend application is a Node.js Express.js server responsible for handling API requests, managing data persistence with MongoDB, and implementing business logic, including user authentication. Our philosophy for the backend emphasizes:

*   **Robustness:** Building reliable and secure APIs, including graceful error handling.
*   **Clarity:** Ensuring API endpoints are intuitive and well-documented.
*   **Maintainability:** Structuring code for easy understanding and future enhancements.
*   **Security:** Implementing best practices for authentication and data protection.

## 2. Technology Stack

*   **Framework:** Node.js with Express.js
*   **Language:** TypeScript
*   **Database:** MongoDB (via Mongoose ODM)
*   **Authentication:** JSON Web Tokens (JWT) with `jsonwebtoken`
*   **Password Hashing:** `bcryptjs`
*   **CORS:** `cors` middleware
*   **Email Service:** `Nodemailer` (for sending emails)

## 3. Architecture

The backend follows a layered architecture:

*   **Routes:** Define API endpoints and handle request/response logic.
    *   `auth.ts`: Contains authentication-related routes (sign-up, sign-in).
*   **Middleware:** Intercept requests for tasks like authentication, logging, etc.
    *   `authMiddleware.ts`: Verifies JWTs and protects routes.
    *   `errorHandler.ts`: Centralized error handling middleware for graceful error management.
*   **Models:** Define Mongoose schemas for MongoDB data structures.
*   **Controllers (Implicit):** Logic for handling specific requests is currently embedded within route handlers. For larger applications, this would be refactored into separate controller files.

## 4. Database

MongoDB is used as the primary data store. Mongoose is used as an Object Data Modeling (ODM) library to interact with MongoDB, providing schema-based solutions to model application data.

*   **Connection:** Established using `mongoose.connect` with URI from environment variables.
*   **User Schema:** A `User` schema is defined for storing user `name`, `email`, hashed `password`, `isVerified` status (boolean), and a `verificationToken` (string).

## 5. Authentication

User authentication is implemented using JWTs and `bcryptjs` for secure password handling.

*   **Register (`POST /api/auth/register`):**
    *   Accepts `name`, `email`, `password`, `dob`, `username`, `gender`, and optionally `mobileNumber`.
    *   Includes basic server-side validation for all required fields and password length (minimum 6 characters).
    *   Checks for existing user by email and username.
    *   Hashes password using `bcryptjs`.
    *   Generates a unique `verificationToken`.
    *   Saves the new user to MongoDB with `isVerified` set to `false`.
    *   Sends a verification email to the user.
    *   Returns a success message and a JWT upon successful registration (user still needs to verify email).
*   **Login (`POST /api/auth/login`):
    *   Accepts `email` and `password`.
    *   Returns 'User not found' if the email is not registered.
    *   Checks if the user's email is verified (`isVerified` status).
    *   Verifies credentials by comparing the provided password with the stored hashed password using `bcryptjs`.
    *   Generates a JWT and returns it upon successful authentication.
*   **Email Verification (`GET /api/auth/verify-email`):**
    *   Accepts a `token` query parameter.
    *   Finds the user associated with the token.
    *   Sets `isVerified` to `true` and clears the `verificationToken`.
    *   Returns a success message, indicating the user can now log in.
*   **Authentication Middleware (`authMiddleware`):**
    *   Verifies the JWT provided in the `x-auth-token` header.
    *   If valid, decodes the token and attaches user information to the request object (`req.user`).
    *   Protects routes by denying access if no token is provided or if the token is invalid.

## 6. API Endpoints

*   **`/` (GET):** Basic health check, returns "Hello from the API!".
*   **`/api/auth/register` (POST):** User registration.
*   **`/api/auth/login` (POST):** User login.
*   **`/api/protected` (GET):** Example of a protected route that requires a valid JWT.

## 7. Development Process & Evolution

*   **Development Server:** `ts-node-dev` is used for development, providing automatic restarts on code changes.
*   **Build Process:** TypeScript is compiled to JavaScript using `tsc`.
*   **Environment Variables:** Sensitive information like `MONGO_URI`, `JWT_SECRET`, `EMAIL_USER`, and `EMAIL_PASS` are managed via environment variables loaded using `dotenv`.
*   **Type Definitions:** Custom type definitions for Express `Request` object (e.g., `req.user`) are managed in `src/types/express.d.ts`.
*   **Code Quality:** We strive for clean, readable, and maintainable code, adhering to TypeScript best practices and consistent coding styles.

**Checkpoint:** A project checkpoint has been created: [family-website-checkpoint.zip](../../family-website-checkpoint.zip)

## 8. Version History

- **v0.1.0 (July 2, 2025):** Initial release with basic authentication routes and foundational project structure.
- **v0.0.2 (July 2, 2025):** Enhanced registration fields (DOB, username, gender, mobileNumber); improved server-side validation for registration; updated email verification flow.
- **v0.0.3 (July 2, 2025):**
    - Changed email verification route from GET to POST.
    - Removed hardcoded MongoDB credentials.
    - Removed hardcoded JWT secret fallbacks.
    - Improved error handling with more specific client messages and detailed logging.
    - Added MongoDB reconnection logic.
    - Enhanced user registration validation (email format, password strength).
    - Defined indexes for 'email' and 'username' in User model.

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

## 1. Overview

The backend application is a Node.js Express.js server responsible for handling API requests, managing data persistence with MongoDB, and implementing business logic, including user authentication.

## 2. Technology Stack

*   **Framework:** Node.js with Express.js
*   **Language:** TypeScript
*   **Database:** MongoDB (via Mongoose ODM)
*   **Authentication:** JSON Web Tokens (JWT) with `jsonwebtoken`
*   **Password Hashing:** `bcryptjs`
*   **CORS:** `cors` middleware

## 3. Architecture

The backend follows a layered architecture:

*   **Routes:** Define API endpoints and handle request/response logic.
*   **Middleware:** Intercept requests for tasks like authentication, logging, etc.
    *   `authMiddleware.ts`: Verifies JWTs and protects routes.
*   **Models:** Define Mongoose schemas for MongoDB data structures.
*   **Controllers (Implicit):** Logic for handling specific requests is currently embedded within route handlers. For larger applications, this would be refactored into separate controller files.

## 4. Database

MongoDB is used as the primary data store. Mongoose is used as an Object Data Modeling (ODM) library to interact with MongoDB, providing schema-based solutions to model application data.

*   **Connection:** Established using `mongoose.connect` with URI from environment variables.
*   **User Schema:** A `User` schema is defined for storing user `name`, `email`, and hashed `password`.

## 5. Authentication

User authentication is implemented using JWTs and `bcryptjs` for secure password handling.

*   **Sign Up (`POST /api/auth/signup`):**
    *   Accepts `name`, `email`, and `password`.
    *   Includes basic server-side validation for all fields and password length (minimum 6 characters).
    *   Hashes the password using `bcryptjs`.
    *   Saves the new user to MongoDB.
    *   Generates a JWT and returns it upon successful registration.
*   **Sign In (`POST /api/auth/signin`):
    *   Accepts `email` and `password`.
    *   Verifies credentials by comparing the provided password with the stored hashed password using `bcryptjs`.
    *   Generates a JWT and returns it upon successful authentication.
*   **Authentication Middleware (`authMiddleware`):**
    *   Verifies the JWT provided in the `x-auth-token` header.
    *   If valid, decodes the token and attaches user information to the request object (`req.user`).
    *   Protects routes by denying access if no token is provided or if the token is invalid.

## 6. API Endpoints

*   **`/` (GET):** Basic health check, returns "Hello from the API!".
*   **`/api/auth/signup` (POST):** User registration.
*   **`/api/auth/signin` (POST):** User login.
*   **`/api/protected` (GET):** Example of a protected route that requires a valid JWT.

## 7. Development Process

*   **Development Server:** `ts-node-dev` is used for development, providing automatic restarts on code changes.
*   **Build Process:** TypeScript is compiled to JavaScript using `tsc`.
*   **Environment Variables:** Sensitive information like `MONGO_URI` and `JWT_SECRET` are managed via environment variables.

# API (`apps/api`) Documentation

This document details the backend API for the Family Website project, built with Node.js and Express.js. It covers environment configuration, authentication routes, and key development considerations.

## 1. Environment Variables

The API relies on several environment variables for proper operation. These should be defined in an `.env` file located in the `apps/api` directory.

*   `PORT`: The port on which the API server will listen (e.g., `3001`).
*   `MONGO_URI`: The connection string for your MongoDB database.
    *   **Important:** If MongoDB is running in a Docker container on the same host as your API (but the API is *not* containerized), use `localhost` as the hostname (e.g., `mongodb://uttam:REDACTED_MONGO_PASSWORD@localhost:27017/family-website?authSource=admin`).
    *   If both your API and MongoDB are in the same Docker Compose network, use the MongoDB service name (e.g., `mongodb://uttam:REDACTED_MONGO_PASSWORD@mongo:27017/family-website?authSource=admin`).
*   `JWT_SECRET`: A long, random, and unique string used for signing JSON Web Tokens. **Crucial for security.**
*   `EMAIL_USER`: Your email address for sending verification emails (e.g., a Gmail address).
*   `EMAIL_PASS`: The app password for your `EMAIL_USER`. For Gmail, you'll need to generate an app password, as direct password usage is often blocked.
*   `FRONTEND_URL`: The base URL of your frontend application. This is used to construct verification links in emails.
    *   **Important:** For multi-device access (e.g., testing on a mobile phone), this *must* be your development machine's local IP address (e.g., `http://192.168.1.8:5173`), not `http://localhost:5173`.

**Example `.env` file:**

```
PORT=3001
MONGO_URI=mongodb://<username>:<password>@localhost:27017/family-website?authSource=admin
JWT_SECRET=<your-super-secret-and-long-jwt-secret>
EMAIL_USER=<your-email@gmail.com>
EMAIL_PASS=<your-gmail-app-password>
FRONTEND_URL=http://<your-local-ip>:5173
```

## 2. Authentication Routes (`src/routes/auth.ts`)

This file defines the core authentication endpoints for the API.

*   **`POST /api/auth/register`**: Handles new user registration.
    *   Performs input validation (name, email, password strength, etc.).
    *   Checks for existing users by email and username.
    *   Hashes passwords using `bcryptjs`.
    *   Generates a `verificationToken` for email verification.
    *   Sends a verification email to the user with a link containing the `verificationToken`.
    *   Returns a JWT upon successful registration.
*   **`POST /api/auth/login`**: Handles user login.
    *   Allows login using either email or username (`identifier`).
    *   Checks if the user's email is verified before allowing login.
    *   Compares passwords using `bcryptjs`.
    *   Returns a JWT upon successful login.
*   **`POST /api/auth/verify-email`**: Handles email verification.
    *   Expects a `token` in the request body.
    *   Finds the user by `verificationToken`.
    *   Marks the user as `isVerified: true` and clears the `verificationToken`.
    *   **Debugging Insight:** A race condition was identified where the `verificationToken` was cleared before the frontend could process the successful response. The `user.save()` operation was reordered to occur *after* the response is sent to mitigate this.
*   **`POST /api/auth/resend-verification`**: **(NEW)** Allows users to request a new verification email.
    *   Expects an `identifier` (email or username) in the request body.
    *   Finds the user and checks if they are already verified.
    *   Reuses the existing `verificationToken` (or generates a new one if needed, though current implementation reuses).
    *   Sends a new verification email to the user.

## 3. Development Considerations

*   **`dotenv` Configuration:** The `dotenv` package is crucial for loading environment variables. In `apps/api/src/index.ts`, `dotenv.config()` is placed at the very top to ensure variables are loaded before any other modules that depend on them. The `npm run dev` script in `package.json` uses `tsx watch --tsconfig ./tsconfig.json -r dotenv/config ./src/index.ts` to preload `dotenv` correctly.
*   **MongoDB Connection:**
    *   The `MONGO_URI` must accurately reflect how your API server connects to your MongoDB instance.
    *   If your API is running directly on your host machine and MongoDB is in Docker, use `localhost` in the `MONGO_URI`.
    *   If both are in Docker Compose, use the service name (`mongo`).
    *   **Debugging Insight:** Persistent "User with this email already exists" errors despite an empty `db.users.find().pretty()` in the `mongo` shell indicated the API was connecting to a different MongoDB instance than the one being inspected. Ensuring consistent `MONGO_URI` across API and `mongo` shell connections resolved this.
*   **Email Service:** The `src/utils/emailService.ts` file uses `nodemailer` to send emails. Ensure `EMAIL_USER` and `EMAIL_PASS` are correctly configured in your `.env` file.
*   **Error Handling:** Centralized error handling middleware (`src/middleware/errorHandler.ts`) is implemented for graceful error management.

# Family Website

This project aims to build a personal/family website, serving as a hands-on learning experience in full-stack web development. It emphasizes continuous learning, code quality, user-centric design, modularity, and scalability.

## Technology Stack

*   **Monorepo Management:** Turborepo
*   **Frontend:** React with Vite and TypeScript
*   **Backend:** Node.js with Express.js
*   **Database:** MongoDB (running in Docker)
*   **Authentication:** JSON Web Tokens (JWT)
*   **Styling:** Tailwind CSS v4.1

## Features

*   User authentication (login, register, email verification, resend verification email)
*   Basic styled login and register pages
*   Custom select component for enhanced UI/UX
*   Centralized error handling
*   Improved email verification flow for mobile users

## Setup & Installation

To get this project up and running on your local machine, follow these steps:

### Image Optimization

For optimal web performance, ensure all images, especially the `family-logo.svg`, are optimized for web use. Consider converting complex SVGs to formats like WebP for faster load times.

### Prerequisites

*   Node.js (LTS version recommended)
*   npm (comes with Node.js)
*   Docker (for MongoDB)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/family-website.git
cd family-website
```

### 2. Install Dependencies

Install dependencies for the monorepo and individual applications:

```bash
npm install
```

### 3. Set up Environment Variables

Environment variables are crucial for both the backend and frontend applications.

*   **Backend (`apps/api`):** Create a `.env` file in the `apps/api` directory. This file will contain variables for database connection, JWT authentication, and email services. Refer to [apps/api/README.md](./apps/api/README.md) for a complete list of required variables and their descriptions, including important notes on `MONGO_URI` and `FRONTEND_URL` for multi-device access.

*   **Frontend (`apps/web`):** Create a `.env` file in the `apps/web` directory. This file will contain variables specific to the frontend, such as the API base URL. Refer to [apps/web/README.md](./apps/web/README.md) for details.

**Important Considerations for `.env` files:**
*   **Security:** Never commit `.env` files to version control. They contain sensitive information.
*   **`FRONTEND_URL` (in `apps/api/.env`):** For testing on multiple devices (e.g., mobile phone), this *must* be your development machine's local IP address (e.g., `http://192.168.1.8:5173`), not `http://localhost:5173`.
*   **`VITE_API_BASE_URL` (in `apps/web/.env`):** Similarly, for multi-device access, this should be your machine's local IP address (e.g., `http://192.168.1.8:3001`), not `http://localhost:3001`.

### 4. Run MongoDB with Docker

Ensure Docker is running, then start the MongoDB container:

```bash
docker-compose up -d
```

### 5. Run the Applications

**Start the Backend API:**

```bash
npm run dev --workspace=apps/api
```

**Start the Frontend Web Application:**

```bash
npm run dev --workspace=apps/web
```

Once both are running, you can access the frontend application in your browser, usually at `http://localhost:5173` (or whatever port Vite assigns).

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## Recent Development & Debugging Insights

This section summarizes the key challenges encountered and solutions implemented during recent development, providing insights into common full-stack development and monorepo debugging practices.

### 1. Environment Variable Configuration & Loading

*   **Challenge:** Initial `FATAL ERROR: JWT_SECRET is not defined` and subsequent `MONGO_URI` issues. This stemmed from incorrect `.env` file placement and improper loading of environment variables.
*   **Solution:**
    *   Ensured `.env` files are correctly placed in `apps/api` and `apps/web`.
    *   Modified `apps/api/package.json`'s `dev` script to use `tsx watch --tsconfig ./tsconfig.json -r dotenv/config ./src/index.ts`. The `-r dotenv/config` flag ensures `dotenv` is preloaded, correctly injecting environment variables before the API server starts.
    *   Corrected `MONGO_URI` in `apps/api/.env` to `mongodb://uttam:uttam%40123@localhost:27017/family-website?authSource=admin` for API running on host and connecting to Dockerized MongoDB.

### 2. Frontend-Backend Communication & Network Issues

*   **Challenge:** "Network error" or "site can't be reached" when accessing the application from mobile devices, and `Cannot POST` errors for new API routes.
*   **Solution:**
    *   Updated `FRONTEND_URL` in `apps/api/.env` and `VITE_API_BASE_URL` in `apps/web/.env` to use the development machine's local IP address (e.g., `http://192.168.1.8:5173` and `http://192.168.1.8:3001` respectively) instead of `localhost`.
    *   Confirmed `apps/web/vite.config.ts` has `server.host: '0.0.0.0'` to allow access from all network interfaces.
    *   **Debugging Insight:** Firewall settings often block incoming connections. Temporarily disabling the firewall (for testing) and then adding specific inbound rules for ports `3001` (API) and `5173` (Frontend) is crucial for multi-device access.

### 3. Email Verification Flow & Race Conditions

*   **Challenge:** "Please verify your email before logging in." message persisting, and "Invalid or expired verification token." errors.
*   **Solution:**
    *   Implemented a new `POST /api/auth/resend-verification` endpoint in `apps/api/src/routes/auth.ts` to allow users to request new verification emails.
    *   Modified `apps/web/src/pages/LoginPage.tsx` to display a "Resend Verification Email" button when the user is unverified, triggering a call to the new backend endpoint.
    *   Corrected the `verificationUrl` construction in `apps/api/src/routes/auth.ts` to include the `verificationToken` as a query parameter (e.g., `http://FRONTEND_URL/verify-email?token=YOUR_TOKEN`).
    *   **Race Condition Fix:** In `apps/api/src/routes/auth.ts`, reordered the `user.save()` operation in the `verify-email` route to occur *after* the successful response is sent. This prevents the `verificationToken` from being cleared prematurely, resolving the "Invalid or expired verification token" error.
    *   In `apps/web/src/pages/VerifyEmailPage.tsx`, implemented a `useRef` hook to ensure the verification logic is executed only once, preventing multiple attempts and potential race conditions on the frontend.
    *   Ensured `apps/web/src/pages/VerifyEmailPage.tsx` sends a POST request with the token in the body to the backend's `/api/auth/verify-email` endpoint.

### 4. Database Consistency

*   **Challenge:** "User with this email already exists" error during registration, but `db.users.find().pretty()` in the `mongo` shell showed an empty collection.
*   **Solution:** This indicated a discrepancy in MongoDB connections. The API server was connecting to a different MongoDB instance or database than the `mongo` shell. Correcting the `MONGO_URI` in `apps/api/.env` to point to the correct `localhost` (for host-based API) and ensuring the `mongo` shell connected to the same instance (using `docker exec ...`) resolved this. New users now persist and are visible.

These changes collectively enhance the application's robustness, user experience, and provide a clearer understanding of its underlying mechanisms.
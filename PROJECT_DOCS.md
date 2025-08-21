# Family Website Project Documentation

This document provides a comprehensive overview of the `family-website` project, detailing its architecture, features, design, and operational logs, aiming to serve as a complete guide for setting up, understanding, and maintaining the project, enabling exact replication of its environment and functionality.

## 1. Project Overview

The `family-website` is a monorepo application designed to provide a platform for family members. It includes user authentication (registration, login, email verification, password reset), profile management, and a foundation for future features like a feed.

## 2. Architecture

The project follows a monorepo structure managed by Turborepo, containing two primary applications: `api` (backend) and `web` (frontend). MongoDB is used as the database, and the entire application stack is containerized using Docker Compose for consistent development and deployment environments.

```
.
├── apps/
│   ├── api/          # Backend API service
│   └── web/          # Frontend web application
├── docker-compose.yml # Defines multi-container Docker application
├── package.json      # Monorepo dependencies and scripts
└── ...               # Other configuration files
```

### 2.1. Service Breakdown

*   **`mongo` (Database Service):** A MongoDB instance running in a Docker container, serving as the primary data store for the application.
*   **`api` (Backend Service):** A Node.js/Express.js API responsible for handling business logic, database interactions, and authentication.
*   **`web` (Frontend Service):** A React.js application that provides the user interface and interacts with the `api` service.

### 2.2. Inter-Service Communication

*   The `api` service connects to the `mongo` service using the Docker service name `mongo` (e.g., `mongodb://mongo:27017/...`).
*   The `web` service communicates with the `api` service via HTTP requests. The API base URL for the frontend is configured to `http://localhost:3000` when running locally via Docker Compose.

## 3. Technologies Used

### 3.1. Core Technologies

*   **Monorepo Management:** Turborepo
*   **Backend:** Node.js, Express.js, TypeScript
*   **Frontend:** React.js, TypeScript, Vite
*   **Database:** MongoDB
*   **Containerization:** Docker, Docker Compose
*   **Styling:** Tailwind CSS v4.1 (hardcoded)
*   **Authentication:** JWT (JSON Web Tokens), bcryptjs for password hashing, nodemailer for email services.

### 3.2. Key Libraries/Frameworks

*   **Express:** Web framework for Node.js (API).
*   **Mongoose:** MongoDB object data modeling (ODM) for Node.js (API).
*   **React:** JavaScript library for building user interfaces (Frontend).
*   **Vite:** Next-generation frontend tooling (Frontend build).
*   **Tailwind CSS:** Utility-first CSS framework (Frontend styling).
*   **bcryptjs:** Library for hashing passwords (API).
*   **jsonwebtoken:** For implementing JWTs (API).
*   **nodemailer:** For sending emails (API).
*   **cookie-parser:** Middleware for parsing cookies (API).
*   **cors:** Middleware for enabling Cross-Origin Resource Sharing (API).
*   **express-rate-limit:** Basic rate-limiting middleware (API).
*   **joi:** Schema description language and data validator (API validation).
*   **tsx:** TypeScript execution for Node.js (API dev server).
*   **turbo:** High-performance build system for JavaScript and TypeScript monorepos.
*   **curl:** Used in Docker healthchecks.
*   **nginx:** Web server for serving the frontend in production Docker environment.
*   **mongosh:** MongoDB Shell for interacting with MongoDB.

## 4. Setup and Installation

To set up and run the `family-website` project, follow these steps:

### 4.1. Prerequisites

Ensure you have the following installed on your system:

*   **Node.js** (LTS version recommended)
*   **npm** (comes with Node.js)
*   **Docker Desktop** (includes Docker Engine and Docker Compose)
*   **Git**
*   **MongoDB Compass** (Optional, for database inspection)

### 4.2. Clone the Repository

```bash
git clone <repository_url>
cd family-website
```

### 4.3. Environment Configuration

Create a `.env` file in the project root directory (`family-website/`) with the following content. Replace placeholder values with your actual secrets and desired configurations.

```dotenv
PORT=3000
MONGO_URI=mongodb://root:REDACTED_PASSWORD@mongo:27017/family-website?authSource=admin
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=REDACTED_PASSWORD
MONGO_APP_USERNAME=uttam
MONGO_APP_PASSWORD=REDACTED_MONGO_PASSWORD
EMAIL_USER=REDACTED_MONGO_PASSWORD@gmail.com
EMAIL_PASS=xgqg ymez dtzd brke
JWT_SECRET=your-super-secret-jwt-key-that-is-long-and-random
REFRESH_TOKEN_SECRET=another-super-secret-refresh-key-that-is-also-long-and-random
FRONTEND_URL=http://localhost:80
GEMINI_API_KEY=REDACTED_GEMINI_API_KEY
```

**Note:** The `MONGO_URI` here is for the API service running inside Docker. When running the API development server directly (outside Docker), the `MONGO_URI` in `apps/api/.env` should be `mongodb://<your_mongo_username>:<your_mongo_password>@localhost:27017/familywebsite?authSource=admin`.

### 4.4. Install Dependencies

From the project root, install the monorepo dependencies:

```bash
npm install
```

### 4.5. Build and Run with Docker Compose

This is the recommended way to run the entire application stack.

1.  **Build and start containers:**

    ```bash
docker compose up -d --build
    ```

    This command will:
    *   Build the Docker images for `api` and `web` services.
    *   Create and start the `mongo` (MongoDB), `api` (backend), and `web` (frontend) containers.
    *   Map host ports to container ports as defined in `docker-compose.yml`.

2.  **Verify container status:**

    ```bash
docker compose ps
    ```

    All services (`mongo`, `api`, `web`) should show a `healthy` status.

3.  **Access the application:**

    *   **Frontend:** `http://localhost:80/`
    *   **API (health check):** `http://localhost:3000/api/health-check`

### 4.6. Running Development Servers (Optional - Outside Docker)

If you prefer to run the `api` or `web` services outside of Docker for faster development cycles, follow these steps:

1.  **Ensure MongoDB is running:** You can start the MongoDB container using `docker compose up -d mongo`.

2.  **For the API (apps/api):**

    *   Navigate to the `apps/api` directory:
        ```bash
        cd apps/api
        ```
    *   Create an `.env` file in `apps/api/` with the following content (note `localhost` for `MONGO_URI`):
        ```dotenv
        PORT=3000
        MONGO_URI=mongodb://<username>:<password>@localhost:27017/familywebsite?authSource=admin
        JWT_SECRET=<your_jwt_secret_key>
        REFRESH_TOKEN_SECRET=<your_refresh_token_secret_key>
        FRONTEND_URL=http://localhost:5173
        ```
    *   Start the development server:
        ```bash
        npm run dev
        ```

3.  **For the Frontend (apps/web):**

    *   Navigate to the `apps/web` directory:
        ```bash
        cd apps/web
        ```
    *   Start the development server:
        ```bash
        npm run dev
        ```

## 5. Key Features

### 5.1. User Authentication

*   **Registration:** Users can create new accounts with email, username, password, name, date of birth, mobile number, and gender.
*   **Login:** Users can log in using either their email or username.
*   **Email Verification:** New registrations require email verification via a tokenized link sent to the user's email address.
*   **Password Reset:** Users can request a password reset via email, receiving a tokenized link to set a new password.
*   **Logout:** Secure logout functionality.
*   **Refresh Tokens:** Implemented for maintaining user sessions and generating new access tokens.
*   **Rate Limiting:** Applied to registration and login endpoints to prevent abuse.
*   **Account Locking:** Accounts are temporarily locked after multiple failed login attempts.

### 5.2. User Profile Management

*   **View Profile:** Users can view their own profile information.
*   **Edit Profile:** Authenticated users can update their personal details (name, date of birth, mobile number, gender).

### 5.3. Health Checks

API and Web services include health check endpoints (`/api/health` and `/healthz` respectively) for Docker Compose to monitor service status.

## 6. Design and Layout (Frontend)

### 6.1. General Design Principles

*   **Responsive Design:** The frontend is built to be responsive, adapting to various screen sizes (mobile, tablet, desktop).
*   **Modern UI:** Utilizes a clean, modern aesthetic with a focus on user experience.
*   **Dark Mode Support:** The application supports a dark mode theme, enhancing usability in low-light environments and providing user preference.

### 6.2. Styling Framework

*   **Tailwind CSS v4.1:** The project uses Tailwind CSS for utility-first styling, allowing for rapid UI development and consistent design.

### 6.3. Key Components and Pages

*   **`AuthButtons.tsx`:** Handles the display and functionality of login/register buttons.
*   **`Button.tsx`:** Reusable button component with primary and secondary styles.
*   **`CustomSelect.tsx`:** A custom dropdown select component for improved styling and functionality.
*   **`DateOfBirthPicker.tsx`:** Component for selecting a date of birth, composed of day, month, and year dropdowns.
*   **`ProtectedRoute.tsx`:** A React component used to protect routes, ensuring only authenticated users can access certain pages.
*   **`LoginPage.tsx`:** User login interface.
*   **`RegisterPage.tsx`:** User registration interface.
*   **`UserProfilePage.tsx`:** Displays and allows editing of user profile information.
*   **`ForgotPasswordPage.tsx`:** Interface for initiating password reset.
*   **`ResetPasswordPage.tsx`:** Interface for setting a new password using a reset token.
*   **`VerifyEmailPage.tsx`:** Page for email verification.
*   **`HomePage.tsx`:** The main landing page of the application.

### 6.4. Theming

The application uses CSS variables for theming, allowing for easy switching between light and dark modes. These variables are defined in `src/index.css` and utilized by Tailwind CSS classes.

## 7. Deployment

This application is designed to be deployed using Docker. The `docker-compose.yml` file is configured for a production environment, and the `Dockerfile.production` files in the `apps/api` and `apps/web` directories are used to build the production images.

To deploy the application, you will need to have a server with Docker and Docker Compose installed. You will also need to have a domain name and a reverse proxy, such as Nginx or Traefik, to handle SSL termination and route traffic to the application.

1.  **Clone the repository to your server.**
2.  **Create a `.env` file with your production environment variables.**
3.  **Build and run the application with Docker Compose:**

    ```bash
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
    ```

## 8. Troubleshooting and Common Issues

This section addresses common issues encountered during the setup and operation of the `family-website` project.

### 8.1. Docker-Related Issues

#### 8.1.1. `connect ECONNREFUSED 127.0.0.1:27017` or `MongoServerError: Authentication failed.`

**Problem:** The API service cannot connect to MongoDB, or authentication fails.

**Possible Causes & Solutions:**

*   **MongoDB container not running:** Ensure the `mongo` container is running and healthy. Check its status with `docker compose ps`.
*   **Incorrect `MONGO_URI`:**
    *   **Inside Docker:** When the API is running inside a Docker container, it must connect to the MongoDB service using its service name (`mongo`), not `localhost`. The `MONGO_URI` in `docker-compose.yml` should be `mongodb://<your_mongo_username>:<your_mongo_password>@mongo:27017/familywebsite?authSource=admin`.
    *   **Outside Docker (dev server):** If running the API development server directly (e.g., `npm run dev --workspace=apps/api`), the `MONGO_URI` in `apps/api/.env` should use `localhost`: `mongodb://<your_mongo_username>:<your_mongo_password>@localhost:27017/familywebsite?authSource=admin`.
*   **`.env` file not loaded/overridden:** Ensure your `.env` files are correctly placed and that Docker Compose is configured to load them (e.g., `env_file: - ./.env`). Be aware that environment variables explicitly set in `docker-compose.yml` will override those in `.env` files.
*   **MongoDB data volume corruption/mismatch:** If you've changed MongoDB versions or encountered persistent connection issues, the existing data volume might be incompatible. Cleanly remove and recreate the volume:
    ```bash
    docker compose down -v
    docker compose up -d --build
    ```
    This ensures a fresh MongoDB instance is initialized with the correct credentials.

#### 8.1.2. `archive/tar: unknown file mode` during Docker build

**Problem:** Docker build fails with an error related to unknown file modes, often in `node_modules`.

**Solution:** This typically happens when `node_modules` from the host machine are included in the Docker build context. Ensure `.dockerignore` files are correctly configured at both the project root and within individual `apps` directories to exclude `node_modules`.

*   **Project Root (`family-website/.dockerignore`):**
    ```
    node_modules
    ```
*   **`apps/api/.dockerignore`:**
    ```
    node_modules
    ```
*   **`apps/web/.dockerignore`:**
    ```
    node_modules
    ```

    After modifying `.dockerignore`, rebuild your containers:
    ```bash
    docker compose up -d --build
    ```

#### 8.1.3. `dependency failed to start: container <service_name> is unhealthy`

**Problem:** A service fails to start because a dependency (e.g., `mongo` or `api`) is unhealthy.

**Solution:** Check the logs of the unhealthy dependency first. For example, if `api` is unhealthy because `mongo` is unhealthy, check `docker logs family-website-mongo` to diagnose the root cause.

### 8.2. Frontend (Web) Issues

#### 8.2.1. TypeScript Compilation Errors

**Problem:** The frontend build fails with TypeScript errors (e.g., `TS2322`, `TS6133`).

**Solution:** Carefully review the error messages, which usually point to specific files and line numbers. Common causes include:

*   **Incorrect component props:** Ensure the props passed to components match their defined interfaces (e.g., `DateOfBirthPicker` expecting `value` instead of `selectedDate`).
*   **Unused variables/imports:** Remove unused imports or variables to resolve `TS6133` errors.
*   **Missing imports:** Ensure all components and types are correctly imported.

#### 8.2.2. `Failed to update profile.`

**Problem:** When attempting to update a user profile, the frontend displays this error.

**Solution:** This indicates an issue on the API side. Ensure the `updateUserProfile` function is correctly implemented in `apps/api/src/controllers/authController.ts` and that the corresponding `PUT` route (`/api/auth/profile/:username`) is defined and correctly imported in `apps/api/src/routes/auth.ts`.

### 8.3. Authentication Issues

#### 8.3.1. `No account found with that email or username. Please register.`

**Problem:** Unable to log in with existing credentials, even if the user is visible in MongoDB Compass.

**Solution:** This almost always means the API is connecting to a different MongoDB database or instance than the one you're inspecting. Verify the `MONGO_URI` used by the API container (as described in 7.1.1) and ensure the database name matches the one where your user data resides.

#### 8.3.2. `MongoServerError: Authentication failed.` (from API logs)

**Problem:** The API service fails to authenticate with MongoDB.

**Solution:** Ensure the `MONGO_URI` in `docker-compose.yml` (for the `api` service) and in `apps/api/.env` (if running the dev server) contains the correct username and password (`admin:password`) and `authSource=admin`.

## 9. Development Logs and Decisions

This section chronicles significant issues encountered during the development of the `family-website` project and the decisions made to resolve them. It serves as a historical record of the project's evolution.

### 9.0. Recent Enhancements and Fixes (August 2025)

This section details recent significant improvements and bug fixes implemented to enhance the project's stability, maintainability, and adherence to modern development practices.

*   **Issue:** Docker containers (API and Web) were not consistently reporting as `healthy` due to missing `curl` in their images and incorrect health check configurations.
    *   **Decision:** Added `curl` to `apps/api/Dockerfile` and `apps/web/Dockerfile`. Corrected health check URLs and port mappings in `docker-compose.yml` to align with Nginx configuration and API routes.
*   **Issue:** The API service failed to start with `ReferenceError: exports is not defined in ES module scope` after `type: module` was added to `package.json`.
    *   **Decision:** Configured `apps/api/tsconfig.json` to compile to `esnext` modules. Refactored `__dirname` usage in `apps/api/src/middleware/fileUpload.ts` and `apps/api/src/routes/documents.ts` to use `import.meta.url` for ES module compatibility.
*   **Issue:** The API service experienced `res.status is not a function` errors, particularly affecting health checks, due to an improperly implemented global CSRF middleware.
    *   **Decision:** Rewrote the CSRF middleware in `apps/api/src/middleware/csrfGenerator.ts` to correctly chain `generateCsrfToken` and `validateCsrfToken` as proper Express middleware. Updated all relevant API route files (`index.ts`, `auth.ts`, `documents.ts`, `userData.ts`) to use the new `csrfProtection` middleware array. The health check route was explicitly mounted before the CSRF middleware to prevent interference.
*   **Issue:** Mongoose logs showed warnings about `Duplicate schema index` for fields like `email`, `username`, and `verificationToken`.
    *   **Decision:** Removed redundant `UserSchema.index()` calls in `apps/api/src/models/User.ts` as `unique: true` already implicitly creates the necessary unique indexes.
*   **Issue:** ESLint reported `no-unused-vars` errors for `ExpressRequestHandler` in API route files after refactoring.
    *   **Decision:** Removed the unused `ExpressRequestHandler` import from `apps/api/src/routes/auth.ts`, `apps/api/src/routes/documents.ts`, and `apps/api/src/routes/userData.ts`.
*   **Issue:** A `MODULE_TYPELESS_PACKAGE_JSON` warning appeared during linting, indicating Node.js was guessing the module type for `eslint.config.js`.
    *   **Decision:** Added `"type": "module"` to `apps/api/package.json` to explicitly declare the package as an ES module, resolving the warning and improving module resolution performance.

### 9.1. Initial Setup and Dockerization

*   **Issue:** `npm run dev --workspace=apps/api` failed with "FATAL ERROR: One or more required environment variables are missing." and "Please check your .env file in the project root."
    *   **Decision:** Created a `.env` file in `apps/api` with placeholder environment variables (`PORT`, `MONGO_URI`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `FRONTEND_URL`).

*   **Issue:** `connect ECONNREFUSED 127.0.0.1:27017` when running `npm run dev --workspace=apps/api`.
    *   **Decision:** This indicated MongoDB was not running. Initiated `docker compose up -d` to start the Dockerized MongoDB service.

*   **Issue:** `docker compose up -d --build` failed with `archive/tar: unknown file mode ?rwxr-xr-x` during Docker build for `api` and `web` services.
    *   **Decision:** This was due to `node_modules` being included in the Docker build context. Added `node_modules` to `.dockerignore` files in `apps/api/` and the project root (`family-website/`).

*   **Issue:** `family-website-mongo` container unhealthy after `docker compose up -d --build`.
    *   **Decision:** MongoDB logs showed version incompatibility with existing data. Performed `docker compose down -v` and `docker compose up -d --build` to remove the old data volume and force a fresh initialization.

### 9.2. Port Uniformity

*   **Issue:** API was running on port `3001` as per `docker-compose.yml`, while `.env` files specified `3000`.
    *   **Decision:** Modified `docker-compose.yml` to change the API port to `3000` for uniformity, updating `ports` mapping, `PORT` environment variable, and `VITE_API_BASE_URL` in the `web` service args.

### 9.3. MongoDB Authentication and Connection

*   **Issue:** `MongoServerError: Authentication failed.` when trying to log in or connect with MongoDB Compass.
    *   **Decision:** Initially, hardcoded `MONGO_INITDB_ROOT_USERNAME` and `MONGO_INITDB_ROOT_PASSWORD` in `docker-compose.yml` for the `mongo` service to ensure credentials were being passed. This helped confirm the issue was not with the credentials themselves but how they were being picked up.
    *   **Decision:** Added `env_file: - ./.env` to both `mongo` and `api` services in `docker-compose.yml` to ensure environment variables from the root `.env` file were loaded.
    *   **Issue:** API container still failed with `connect ECONNREFUSED 127.0.0.1:27017`.
        *   **Decision:** Realized `apps/api/src/index.ts` was loading its own `.env` file via `dotenv.config()`, overriding Docker Compose environment variables. Removed `dotenv.config()` from `apps/api/src/index.ts`.
        *   **Decision:** Removed the `MONGO_URI` line from `apps/api/.env` to prevent it from overriding the Docker Compose-provided `MONGO_URI`.
    *   **Issue:** `MongoServerError: Authentication failed.` persisted for the API container.
        *   **Decision:** Hardcoded `MONGO_URI` in `docker-compose.yml` for the `api` service to `mongodb://<your_mongo_username>:<your_mongo_password>@mongo:27017/familywebsite?authSource=admin` to ensure the API was connecting to the correct service name (`mongo`) and using the correct credentials.

*   **Issue:** `No account found with that email or username. Please register.` despite user existing in MongoDB Compass.
    *   **Decision:** Discovered a mismatch in the database name. The API container was connecting to `family_website` (with an underscore) while Compass was showing data in `familywebsite` (without an underscore). Corrected the database name in the `MONGO_URI` in `docker-compose.yml` to `familywebsite`.

### 9.4. User Profile Update Functionality

*   **Issue:** "Failed to update profile." error when trying to edit profile.
    *   **Decision:** Identified that the `updateUserProfile` function was missing in `apps/api/src/controllers/authController.ts`. Implemented the `updateUserProfile` function to handle `PUT` requests for user profile updates.
    *   **Decision:** Added the corresponding `router.put('/profile/:username', updateUserProfile as RequestHandler<{ username: string }>);` route to `apps/api/src/routes/auth.ts`.
    *   **Issue:** Docker build failed with `Cannot find name 'updateUserProfile'` in `src/routes/auth.ts`.
        *   **Decision:** Added `updateUserProfile` to the import statement in `apps/api/src/routes/auth.ts`.

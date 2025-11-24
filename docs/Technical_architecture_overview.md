# Technical Architecture Overview: family-website

This document is an auto-generated knowledge base for the `family-website` project. It contains a synthesized overview of the project's architecture, technologies, and key operational commands to ensure efficient and context-aware assistance.

## 1. Project Overview

- **Type:** Full-stack web application.
- **Purpose:** A private platform for family members, featuring user authentication, profile management, and a foundation for future family-oriented tools.
- **Structure:** Monorepo managed by **Turborepo**.
- **Services:**
  - `apps/api`: Backend service (Node.js/Express.js).
  - `apps/web`: Frontend service (React/Vite).
  - `mongo`: MongoDB database service.
- **Containerization:** The entire stack is containerized using **Docker** and orchestrated with **Docker Compose**.

## 2. Technology Stack

| Category             | Technology                                         |
| -------------------- | -------------------------------------------------- |
| **Monorepo**         | Turborepo                                          |
| **Backend**          | Node.js, Express.js, TypeScript, Mongoose, TSX     |
| **Frontend**         | React.js, Vite, TypeScript                         |
| **Database**         | MongoDB                                            |
| **Styling**          | Tailwind CSS v4.1                                  |
| **Containerization** | Docker, Docker Compose, Nginx (for production web) |
| **Authentication**   | JWT, bcryptjs, cookie-parser, nodemailer           |
| **API Validation**   | Joi                                                |
| **Testing**          | Jest (API), Vitest (Web)                           |

## 3. Key Scripts

| Command                        | Description                                              |
| ------------------------------ | -------------------------------------------------------- |
| `npm install`                  | Installs all dependencies from the root.                 |
| `npm run dev`                  | Starts all applications in development mode (via Turbo). |
| `npm run build`                | Builds all applications for production (via Turbo).      |
| `npm run lint`                 | Lints all applications (via Turbo).                      |
| `npm run test --workspace=api` | Runs tests for the API service.                          |
| `npm run test --workspace=web` | Runs tests for the web frontend.                         |
| `docker compose up -d --build` | Builds and starts the entire application stack.          |
| `docker compose down -v`       | Stops and removes containers and volumes.                |

## 4. Core Functionality

- **User Authentication:**
  - Registration with email verification.
  - Login with email/username.
  - Password reset via email.
  - Secure session management with JWT (access and refresh tokens).
  - Rate limiting and account locking.
- **User Profile Management:**
  - View and edit user profile information.
- **Health Checks:**
  - API and Web services have health check endpoints for monitoring.

## 5. Setup and Operations

1.  **Prerequisites:** Node.js, npm, Docker Desktop.
2.  **Configuration:** Create a `.env` file in the project root with necessary environment variables (`MONGO_URI`, `JWT_SECRET`, etc.).
3.  **Installation:** Run `npm install` from the root directory.
4.  **Execution:** Run `docker compose up -d --build` to start all services.
    - **Frontend URL:** `http://localhost:5173`
    - **API Health:** `http://localhost:3000/api/health`

## 6. Key Configuration Files

- `C:\Users\alpha\Development\Work\Github\family-website\docker-compose.yml`: Main service orchestration.
- `C:\Users\alpha\Development\Work\Github\family-website\turbo.json`: Monorepo task configuration.
- `C:\Users\alpha\Development\Work\Github\family-website\package.json`: Root dependencies and scripts.
- `C:\Users\alpha\Development\Work\Github\family-website\apps\api\package.json`: API dependencies and scripts.
- `C:\Users\alpha\Development\Work\Github\family-website\apps\web\package.json`: Web dependencies and scripts.
- `C:\Users\alpha\Development\Work\Github\family-website\apps\web\vite.config.ts`: Vite configuration.
- `C:\Users\alpha\Development\Work\Github\family-website\apps\web\tailwind.config.ts`: Tailwind CSS configuration.

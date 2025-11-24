# Architecture

This document provides an overview of the Family Website project's architecture and design.

## Project Structure

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

## Service Breakdown

### MongoDB (Database Service)

A MongoDB instance running in a Docker container, serving as the primary data store for the application.

- **Container Name:** `mongo`
- **Port:** 27017
- **Authentication:** Username and password authentication
- **Database Name:** `familywebsite`

### API (Backend Service)

A Node.js/Express.js API responsible for handling business logic, database interactions, and authentication.

- **Container Name:** `api`
- **Port:** 3000
- **Technologies:** Node.js, Express.js, TypeScript
- **Key Features:** User authentication, profile management, email verification

#### API Directory Structure

```
api/
├── src/
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── index.ts        # Entry point
├── .env                # Environment variables
├── Dockerfile          # Docker configuration
└── ...                 # Other configuration files
```

### Web (Frontend Service)

A React.js application that provides the user interface and interacts with the `api` service.

- **Container Name:** `web`
- **Port:** 5173
- **Technologies:** React.js, TypeScript, Vite, Tailwind CSS
- **Key Features:** User authentication UI, profile management, responsive design

#### Web Directory Structure

```
web/
├── public/            # Static assets
├── src/
│   ├── api/           # API client
│   ├── assets/        # Frontend assets
│   ├── components/    # React components
│   ├── context/       # React context providers
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── types/         # TypeScript type definitions
│   ├── App.tsx        # Main App component
│   └── main.tsx       # Entry point
├── .env               # Environment variables
├── Dockerfile         # Docker configuration
└── ...                # Other configuration files
```

## Inter-Service Communication

- The `api` service connects to the `mongo` service using the Docker service name `mongo` (e.g., `mongodb://mongo:27017/...`).
- The `web` service communicates with the `api` service via HTTP requests. The API base URL for the frontend is configured to `http://localhost:3000` when running locally via Docker Compose.

## Authentication Flow

1. **Registration:**
   - User submits registration form with email, username, password, and personal details
   - API validates input, checks for existing users
   - Password is hashed using bcryptjs
   - Verification token is generated and sent via email
   - User record is created in the database

2. **Email Verification:**
   - User clicks verification link in email
   - Frontend extracts verification token from URL
   - Token is sent to API for validation
   - API marks user as verified in the database

3. **Login:**
   - User submits login form with email/username and password
   - API validates credentials and checks if email is verified
   - JWT access token is generated and returned to frontend
   - Frontend stores token in memory and sets refresh token in HTTP-only cookie

4. **Authentication State:**
   - Frontend maintains authentication state using React Context
   - Protected routes check authentication status before rendering
   - Automatic token refresh mechanism keeps the user logged in

## Data Models

### User Model

```typescript
interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  password: string; // Hashed
  dateOfBirth: Date;
  mobileNumber: string;
  gender: "male" | "female" | "other";
  isVerified: boolean;
  verificationToken: string | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

## Security Considerations

- Passwords are hashed using bcryptjs
- JWT tokens are used for authentication
- HTTP-only cookies are used for refresh tokens
- Rate limiting is applied to sensitive endpoints
- Input validation is performed on all user inputs
- CORS is configured to restrict access to the API

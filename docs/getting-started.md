# Getting Started

This guide will help you set up and run the Family Website project on your local machine.

## Prerequisites

Ensure you have the following installed on your system:

- **Node.js** (LTS version recommended)
- **npm** (comes with Node.js)
- **Docker Desktop** (includes Docker Engine and Docker Compose)
- **Git**
- **MongoDB Compass** (Optional, for database inspection)

## Clone the Repository

```bash
git clone <repository_url>
cd family-website
```

## Environment Configuration

Create a `.env` file in the project root directory (`family-website/`) with the following content. Replace placeholder values with your actual secrets and desired configurations.

```dotenv
PORT=3000
MONGO_URI=mongodb://admin:password@mongo:27017/familywebsite?authSource=admin
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=REDACTED_PASSWORD
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
JWT_SECRET=your_jwt_secret_key
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key
FRONTEND_URL=http://localhost:5173
```

**Note:** The `MONGO_URI` here is for the API service running inside Docker. When running the API development server directly (outside Docker), the `MONGO_URI` in `apps/api/.env` should be `mongodb://admin:password@localhost:27017/familywebsite?authSource=admin`.

## Install Dependencies

From the project root, install the monorepo dependencies:

```bash
npm install
```

## Build and Run with Docker Compose

This is the recommended way to run the entire application stack.

1.  **Build and start containers:**

    ```bash
    docker compose up -d --build
    ```

    This command will:
    - Build the Docker images for `api` and `web` services.
    - Create and start the `mongo` (MongoDB), `api` (backend), and `web` (frontend) containers.
    - Map host ports to container ports as defined in `docker-compose.yml`.

2.  **Verify container status:**

    ```bash
    docker compose ps
    ```

    All services (`mongo`, `api`, `web`) should show a `healthy` status.

3.  **Access the application:**
    - **Frontend:** `http://localhost:5173/`
    - **API (health check):** `http://localhost:3000/api/health`

## Running Development Servers (Outside Docker)

If you prefer to run the `api` or `web` services outside of Docker for faster development cycles, follow these steps:

1.  **Ensure MongoDB is running:** You can start the MongoDB container using `docker compose up -d mongo`.

2.  **For the API (apps/api):**
    - Navigate to the `apps/api` directory:
      ```bash
      cd apps/api
      ```
    - Create an `.env` file in `apps/api/` with the following content (note `localhost` for `MONGO_URI`):
      ```dotenv
      PORT=3000
      MONGO_URI=mongodb://admin:password@localhost:27017/familywebsite?authSource=admin
      JWT_SECRET=your_jwt_secret_key
      REFRESH_TOKEN_SECRET=your_refresh_token_secret_key
      FRONTEND_URL=http://localhost:5173
      ```
    - Start the development server:
      ```bash
      npm run dev
      ```

3.  **For the Frontend (apps/web):**
    - Navigate to the `apps/web` directory:
      ```bash
      cd apps/web
      ```
    - Start the development server:
      ```bash
      npm run dev
      ```

## Next Steps

Once you have the application running, you can:

1. Register a new user account
2. Verify your email (check your email for the verification link)
3. Log in with your credentials
4. Explore your user profile

For more detailed information about the project, refer to the other documentation files in this directory.

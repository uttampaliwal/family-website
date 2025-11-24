# Docker and MongoDB Guide

This guide provides detailed instructions for working with Docker and MongoDB in the Family Website project.

## Docker Setup

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Basic understanding of Docker concepts (containers, images, volumes)

### Docker Compose Configuration

The project uses Docker Compose to define and run multi-container Docker applications. The main configuration file is `docker-compose.yml` in the project root.

```yaml
version: "3.8"

services:
  mongo:
    image: mongo:latest
    container_name: family-website-mongo
    restart: always
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    volumes:
      - mongo-data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: family-website-api
    restart: always
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - MONGO_URI=mongodb://admin:password@mongo:27017/familywebsite?authSource=admin
      - JWT_SECRET=your_jwt_secret_key
      - REFRESH_TOKEN_SECRET=your_refresh_token_secret_key
      - FRONTEND_URL=http://localhost:5173
    depends_on:
      mongo:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      args:
        - VITE_API_BASE_URL=http://localhost:3000
    container_name: family-website-web
    restart: always
    ports:
      - "5173:5173"
    depends_on:
      api:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5173/healthz"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

volumes:
  mongo-data:
```

### Docker Commands

#### Starting the Application

```bash
# Build and start all containers
docker compose up -d --build

# Start only specific services
docker compose up -d mongo api
```

#### Stopping the Application

```bash
# Stop all containers
docker compose down

# Stop and remove volumes (will delete database data)
docker compose down -v
```

#### Viewing Logs

```bash
# View logs for all containers
docker compose logs

# View logs for a specific container
docker compose logs api

# Follow logs in real-time
docker compose logs -f web
```

#### Checking Container Status

```bash
# List all containers and their status
docker compose ps
```

#### Executing Commands in Containers

```bash
# Open a shell in the API container
docker compose exec api sh

# Open a MongoDB shell
docker compose exec mongo mongosh -u admin -p ${MONGO_PASSWORD} --authenticationDatabase admin
```

### Dockerfile Explanations

#### API Dockerfile (`apps/api/Dockerfile`)

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm ci

# Development build
FROM base AS development
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set working directory to the API app
WORKDIR /app/apps/api

# Start the API server
CMD ["npm", "run", "dev"]

# Production build
FROM base AS production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the API
RUN npm run build --workspace=apps/api

# Set working directory to the API app
WORKDIR /app/apps/api

# Start the API server
CMD ["node", "dist/index.js"]
```

#### Web Dockerfile (`apps/web/Dockerfile`)

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN npm ci

# Development build
FROM base AS development
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set working directory to the web app
WORKDIR /app/apps/web

# Build arguments
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Start the web server
CMD ["npm", "run", "dev", "--", "--host"]

# Production build
FROM base AS production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build the web app
RUN npm run build --workspace=apps/web

# Use nginx to serve the built app
FROM nginx:alpine AS nginx
COPY --from=production /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

## MongoDB Setup

### MongoDB Configuration

MongoDB is configured in the Docker Compose file with the following settings:

- **Username:** admin
- **Password:** ${MONGO_PASSWORD}
- **Database:** familywebsite
- **Port:** 27017
- **Authentication Source:** admin

### Connecting to MongoDB

#### Using MongoDB Compass

1. Install [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect using the following connection string:
   ```
   mongodb://admin:${MONGO_PASSWORD}@localhost:27017/familywebsite?authSource=admin
   ```

#### Using MongoDB Shell

```bash
# Connect to MongoDB shell
docker compose exec mongo mongosh -u admin -p ${MONGO_PASSWORD} --authenticationDatabase admin

# Switch to the familywebsite database
use familywebsite

# List all collections
show collections

# Query the users collection
db.users.find()
```

### MongoDB Data Structure

#### User Collection

```javascript
{
  _id: ObjectId("..."),
  name: "John Doe",
  email: "john@example.com",
  username: "johndoe",
  password: "<hashed_password_example>", // Example hashed password, replace with a real hashed password", // Hashed password
  dateOfBirth: ISODate("1990-01-01"),
  mobileNumber: "1234567890",
  gender: "male",
  isVerified: true,
  verificationToken: null,
  passwordResetToken: null,
  passwordResetExpires: null,
  createdAt: ISODate("2023-01-01T00:00:00.000Z"),
  updatedAt: ISODate("2023-01-01T00:00:00.000Z")
}
```

### Common MongoDB Operations

#### Creating a User

```javascript
db.users.insertOne({
  name: "John Doe",
  email: "john@example.com",
  username: "johndoe",
  password: "<hashed_password>", // Use environment variable or secure secret management
  dateOfBirth: new Date("1990-01-01"),
  mobileNumber: "1234567890",
  gender: "male",
  isVerified: false,
  verificationToken: "abc123",
  passwordResetToken: null,
  passwordResetExpires: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

#### Finding a User

```javascript
// Find by email
db.users.findOne({ email: "john@example.com" });

// Find by username
db.users.findOne({ username: "johndoe" });

// Find by verification token
db.users.findOne({ verificationToken: "abc123" });
```

#### Updating a User

```javascript
// Verify a user's email
db.users.updateOne(
  { email: "john@example.com" },
  {
    $set: {
      isVerified: true,
      verificationToken: null,
      updatedAt: new Date(),
    },
  },
);

// Update a user's profile
db.users.updateOne(
  { username: "johndoe" },
  {
    $set: {
      name: "John Smith",
      mobileNumber: "9876543210",
      updatedAt: new Date(),
    },
  },
);
```

#### Deleting a User

```javascript
// Delete by email
db.users.deleteOne({ email: "john@example.com" });

// Delete by username
db.users.deleteOne({ username: "johndoe" });
```

## Troubleshooting Docker and MongoDB Issues

### Common Docker Issues

#### Container Not Starting

**Problem:** A container fails to start or becomes unhealthy.

**Solution:**

1. Check the container logs:
   ```bash
   docker compose logs <service_name>
   ```
2. Ensure all required environment variables are set.
3. Verify that dependent services are running and healthy.

#### Port Conflicts

**Problem:** "Error starting userland proxy: listen tcp 0.0.0.0:27017: bind: address already in use"

**Solution:**

1. Check if another process is using the port:

   ```bash
   # On Windows
   netstat -ano | findstr :27017

   # On macOS/Linux
   lsof -i :27017
   ```

2. Stop the conflicting process or change the port mapping in `docker-compose.yml`.

#### Volume Permissions

**Problem:** "Permission denied" errors when accessing mounted volumes.

**Solution:**

1. Ensure the container user has appropriate permissions.
2. Try removing the volume and recreating it:
   ```bash
   docker compose down -v
   docker compose up -d
   ```

### Common MongoDB Issues

#### Authentication Failed

**Problem:** "MongoServerError: Authentication failed."

**Solution:**

1. Verify that the username and password in the connection string match the MongoDB credentials.
2. Ensure the `authSource` parameter is set correctly (usually `admin`).
3. If the issue persists, try recreating the MongoDB container:
   ```bash
   docker compose down -v
   docker compose up -d mongo
   ```

#### Connection Refused

**Problem:** "connect ECONNREFUSED 127.0.0.1:27017"

**Solution:**

1. Ensure the MongoDB container is running:
   ```bash
   docker compose ps mongo
   ```
2. Check if MongoDB is listening on the expected port:
   ```bash
   docker compose exec mongo mongosh --eval "db.adminCommand('getCmdLineOpts')"
   ```
3. Verify the connection string:
   - When connecting from outside Docker, use `localhost`.
   - When connecting from another container, use the service name (`mongo`).

#### Database Not Found

**Problem:** "Database not found" or empty query results.

**Solution:**

1. Verify that you're connecting to the correct database:
   ```bash
   docker compose exec mongo mongosh -u admin -p ${MONGO_PASSWORD} --authenticationDatabase admin
   show dbs
   ```
2. Check if the database name in the connection string matches the actual database name.
3. If the database is empty, it might not show up in the list until data is inserted.

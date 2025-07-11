# Base image with Node.js and Turborepo CLI
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g turbo

# This stage creates a minimal version of the monorepo with only the code
# and dependencies required to build the 'web' application.
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune --scope=web --docker

# Stage 2: Build the React application
FROM base AS builder
WORKDIR /app

# Accept the VITE_API_BASE_URL build argument from docker-compose.yml.
ARG VITE_API_BASE_URL
# Set it as an environment variable for the 'npm run build' command.
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL


# Copy the pruned files from the 'pruner' stage.
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Install all dependencies (including devDependencies for building).
RUN npm ci

# Copy the pruned source code.
COPY --from=pruner /app/out/full/ .

# Build the 'web' application.
RUN turbo run build --filter=web

# Stage 3: Serve the application with a lightweight web server
FROM nginx:alpine
# Add curl for healthchecks.
RUN apk add --no-cache curl

# Copy the built assets from the correct path in the builder stage.
COPY --from=builder /app/apps/web/dist/ /usr/share/nginx/html
# Copy the nginx config from its location in the project source.
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]

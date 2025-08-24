# Stage 1: Base image with monorepo dependencies
FROM node:20-alpine AS base
ARG TURBO_TELEMETRY_DISABLED
WORKDIR /app

# Update npm to the latest version
RUN npm install -g npm@latest

# Copy root package files and turbo config
COPY package.json package-lock.json turbo.json ./

# Install all dependencies for the entire monorepo
RUN npm install --no-audit --silent

# Copy all source code
COPY . .

# Stage 2: Prune the monorepo for the 'web' app
FROM base AS pruner
ARG TURBO_TELEMETRY_DISABLED
WORKDIR /app

# Prune to only the files needed for the 'web' app
RUN npx turbo prune --scope=web --docker

# Stage 3: Build the application
FROM node:20-alpine AS builder
ARG TURBO_TELEMETRY_DISABLED
WORKDIR /app

# Update npm to the latest version
RUN npm install -g npm@latest

# Copy the pruned files from the 'pruner' stage
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Install dependencies for the pruned 'web' app
RUN npm install --no-audit --silent

# Copy the pruned source code
COPY --from=pruner /app/out/full/ .

# Build the 'web' application
RUN npx turbo run build --filter=web

# Stage 4: Serve the application with Nginx
FROM nginx:stable-alpine AS runner
RUN apk add --no-cache curl

# Copy the built assets from the builder stage
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy the nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
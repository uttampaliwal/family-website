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

# Stage 2: Prune the monorepo for the 'api' app
FROM base AS pruner
ARG TURBO_TELEMETRY_DISABLED
WORKDIR /app

# Prune to only the files needed for the 'api' app
RUN npx turbo prune --scope=api --docker

# Stage 3: Build the application
FROM base AS builder
ARG TURBO_TELEMETRY_DISABLED
WORKDIR /app

# Update npm to the latest version
RUN npm install -g npm@latest

# Copy the pruned files from the 'pruner' stage
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Install dependencies for the pruned 'api' app
RUN npm install --no-audit --silent

# Copy the pruned source code
COPY --from=pruner /app/out/full/ .

# Build the 'api' application
RUN npx turbo run build --filter=api

# Stage 4: Production image
FROM node:20-alpine AS production
WORKDIR /app

# Update npm to the latest version
RUN npm install -g npm@latest

RUN apk add --no-cache curl

# Copy production dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Copy the built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Install production dependencies only
RUN npm ci --omit=dev --no-audit --silent

EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
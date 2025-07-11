# Base image with Node.js and Turborepo CLI
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g turbo

# Stage 1: Prune the monorepo
# This stage creates a minimal version of the monorepo with only the code
# and dependencies required to build the 'api' application.
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune --scope=api --docker

# Stage 2: The Builder
# This stage builds the 'api' application using the pruned monorepo.
FROM base AS builder
WORKDIR /app

# Copy the pruned files from the 'pruner' stage.
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Install all dependencies (including devDependencies for building).
RUN npm ci

# Copy the pruned source code.
COPY --from=pruner /app/out/full/ .

# Build the 'api' application.
RUN turbo run build --filter=api

# Stage 3: The Production Image
# This stage creates a lean final image with only the compiled code and production dependencies.
FROM node:20-alpine
WORKDIR /app

# Add curl for healthchecks.
RUN apk add --no-cache curl

# Copy the pruned dependency manifests from the pruner stage, which has the correct structure for all workspaces.
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./
RUN npm install --omit=dev

# Copy the built 'api' application code.
COPY --from=builder /app/apps/api/dist ./dist

EXPOSE 3001
CMD ["node", "dist/index.js"]

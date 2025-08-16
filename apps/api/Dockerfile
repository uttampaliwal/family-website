# Stage 1: Prune the monorepo to get only the files needed for the 'api' app.
FROM node:20-alpine AS pruner
WORKDIR /app
RUN npm install -g turbo

COPY . .
RUN turbo prune --scope=api --docker

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g turbo

# Copy the pruned files from the 'pruner' stage.
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Install dependencies.
RUN npm ci

# Copy the pruned source code.
COPY --from=pruner /app/out/full/ .
COPY . .

# Build the 'api' application.
RUN turbo run build --filter=api

# Stage 3: Production Image
FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache curl

# Copy only the necessary files from the builder stage.
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Install production dependencies
RUN npm ci --omit=dev

# Set the runtime command
CMD ["node", "apps/api/dist/index.js"]

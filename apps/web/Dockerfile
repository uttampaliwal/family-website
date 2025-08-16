# Stage 1: Prune the monorepo to get only the files needed for the 'web' app.
FROM node:20-alpine AS pruner
WORKDIR /app
RUN npm install -g turbo

COPY . .
RUN turbo prune --scope=web --docker

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

# Build the 'web' application.
RUN turbo run build --filter=web

# Stage 3: Serve the application with Nginx
FROM nginx:stable-alpine
RUN apk add --no-cache curl
# Copy the built assets from the builder stage.
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
# Copy the nginx config.
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

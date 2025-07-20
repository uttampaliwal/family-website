# syntax=docker/dockerfile:1

# --- Base Stage ---
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# --- Builder Stage ---
FROM base as builder
WORKDIR /app
COPY package.json package-lock.json* turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY tsconfig.json ./
RUN npm ci
COPY . .
RUN npx turbo run build --filter=./apps/api

# --- Runner Stage ---
FROM node:20-alpine as runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs
RUN apk add --no-cache curl
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN npm ci --omit=dev --filter=api

COPY --from=builder /app/apps/api/dist ./dist

USER expressjs
EXPOSE 3000
CMD ["node", "dist/index.js"]
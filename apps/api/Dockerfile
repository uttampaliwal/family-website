# Stage 1: The Builder
# This stage installs all dependencies (including devDependencies) and builds the TypeScript source.
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: The Production Image
# This stage creates a lean final image with only the compiled code and production dependencies.
FROM node:20-alpine
WORKDIR /app

# Copy the compiled code and package.json from the builder stage.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Install only the production dependencies.
RUN npm install --omit=dev

EXPOSE 3001
CMD ["node", "dist/index.js"]

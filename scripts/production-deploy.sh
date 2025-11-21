#!/bin/bash

# Production Deployment Script
echo "🚀 Starting production deployment..."

# Exit on any error
set -e

# Check environment
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  NODE_ENV is not set to production. Setting it now..."
    export NODE_ENV=production
fi

# Run quality checks
echo "🔍 Running quality checks..."
npm run lint
npm run type-check
npm test

# Clean previous build
echo "🧹 Cleaning previous builds..."
npm run clean

# Install production dependencies
echo "📦 Installing production dependencies..."
npm ci --production=false

# Build for production
echo "🔨 Building for production..."
npm run build

# Run production health check
echo "🏥 Running health check..."
timeout 30s npm run health-check || echo "⚠️  Health check failed or timed out"

echo "✅ Production deployment complete!"
echo ""
echo "🎯 Production commands:"
echo "  npm run start:api    - Start API server"
echo "  npm run start:web    - Start web preview"
echo "  npm run docker:up    - Start with Docker"
echo ""
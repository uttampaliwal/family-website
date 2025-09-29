#!/bin/bash

# Development Setup Script
echo "🚀 Setting up Family Portal development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
MIN_VERSION="18.0.0"
if [ "$(printf '%s\n' "$MIN_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$MIN_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file from .env.example"
        echo "🔧 Please update .env with your actual configuration"
    else
        echo "❌ No .env.example file found. Please create .env manually."
    fi
fi

# Build the project
echo "🔨 Building project..."
npm run build

echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Quick start commands:"
echo "  npm run dev          - Start development servers"
echo "  npm run dev:api      - Start API server only"
echo "  npm run dev:web      - Start web app only"
echo "  npm test             - Run all tests"
echo "  npm run lint         - Check code quality"
echo ""
echo "📚 More commands available in package.json"
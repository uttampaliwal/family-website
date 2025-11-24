# 🚀 **Complete Development Guide - Family Portal**

## 📖 **Table of Contents**

1. [🆕 New PC Setup](#-new-pc-setup)
2. [🐳 Docker Development](#-docker-development)
3. [🏗️ Production Deployment](#%EF%B8%8F-production-deployment)
4. [☁️ Vercel Deployment](#%EF%B8%8F-vercel-deployment)
5. [🧪 Testing Guide](#-testing-guide)
6. [💻 Local Development](#-local-development)
7. [📚 Complete Scripts Reference](#-complete-scripts-reference)
8. [🚨 Troubleshooting](#-troubleshooting)

---

## 🆕 **New PC Setup**

### **Prerequisites**

Before starting, ensure you have:

- **Node.js 18+** ([Download here](https://nodejs.org/))
- **Git** ([Download here](https://git-scm.com/))
- **MongoDB** (for local development) or **MongoDB Atlas** account
- **Code Editor** (VS Code recommended)

### **Step 1: Clone Repository**

```bash
git clone <repository-url>
cd family-portal
```

### **Step 2: Automated Setup (Recommended)**

```bash
# Run the automated setup script
./scripts/dev-setup.sh     # On macOS/Linux
# OR manually on Windows:
npm run setup
```

### **Step 3: Manual Setup (Alternative)**

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - MONGODB_URI
# - JWT_SECRET
# - EMAIL_SERVICE credentials (optional for development)

# Build the project
npm run build

# Verify setup
npm run health-check
```

### **Step 4: First Run**

```bash
# Start development servers
npm run dev

# Or start services separately
npm run dev:api    # Terminal 1 (API on port 5000)
npm run dev:web    # Terminal 2 (Web on port 3000)
```

### **Step 5: Create Admin User**

```bash
# Seed admin user (required for admin features)
npm run db:seed:admin
```

### **✅ Verification Checklist**

- [ ] API running on http://localhost:5000
- [ ] Web app running on http://localhost:3000
- [ ] Database connected (check API logs)
- [ ] Admin user created
- [ ] Tests passing: `npm test`
- [ ] Linting clean: `npm run lint`

---

## 🐳 **Docker Development**

### **Quick Start with Docker**

```bash
# Build and start all services
npm run docker:build
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

### **Docker Configuration**

The project includes:

- **`docker-compose.yml`** - Production configuration
- **`docker-compose.dev.yml`** - Development configuration
- **`Dockerfile`** - API container configuration
- **`apps/web/Dockerfile`** - Web container configuration

### **Development with Docker**

```bash
# Start with development configuration
docker-compose -f docker-compose.dev.yml up -d

# Start specific services
docker-compose up api        # API only
docker-compose up web        # Web only
docker-compose up mongo      # Database only

# Rebuild specific service
docker-compose build api
docker-compose up -d api

# Execute commands in containers
docker-compose exec api npm run test
docker-compose exec api npm run db:seed:admin
```

### **Docker Environment Variables**

Create `.env.docker` for Docker-specific configuration:

```bash
# Database
MONGODB_URI=mongodb://mongo:27017/family_portal
NODE_ENV=development

# API
API_PORT=5000
JWT_SECRET=your-docker-jwt-secret

# Web
VITE_API_URL=http://localhost:5000/api
```

### **Docker Networking**

- **API**: http://localhost:5000
- **Web**: http://localhost:3000
- **MongoDB**: mongodb://localhost:27017

### **Docker Utilities**

```bash
# View container status
docker-compose ps

# View service logs
docker-compose logs api
docker-compose logs web
docker-compose logs mongo

# Clean Docker resources
docker-compose down -v    # Remove volumes
docker system prune       # Clean unused resources
```

---

## 🏗️ **Production Deployment**

### **Production Build Process**

```bash
# Run production deployment script
./scripts/production-deploy.sh

# Or manual steps:
npm run lint              # Quality checks
npm run type-check        # TypeScript validation
npm test                  # Run all tests
npm run build            # Production builds
npm run preview          # Test production build
```

### **Environment Configuration**

Create `.env.production`:

```bash
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/family_portal_prod
NODE_ENV=production

# Security
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
BCRYPT_ROUNDS=12

# API Configuration
API_PORT=5000
CORS_ORIGIN=https://yourdomain.com

# Email Service (for notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Logging
LOG_LEVEL=info
LOG_FILE=logs/production.log
```

### **Production Deployment Options**

#### **Option 1: Traditional Server (PM2)**

```bash
# Install PM2 globally
npm install -g pm2

# Build for production
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit
pm2 logs
```

#### **Option 2: Docker Production**

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Health check
curl http://localhost:5000/health
```

#### **Option 3: Kubernetes**

```bash
# Apply Kubernetes manifests (if available)
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services
```

### **Production Health Monitoring**

```bash
# Health checks
npm run health-check

# Performance monitoring
npm run logs                 # View application logs
docker-compose logs -f      # Docker logs

# Database monitoring
mongosh $MONGODB_URI --eval "db.stats()"
```

---

## ☁️ **Vercel Deployment**

### **Frontend (Web App) to Vercel**

#### **Step 1: Prepare for Vercel**

```bash
# Build web app
cd apps/web
npm run build

# Test production build locally
npm run preview
```

#### **Step 2: Vercel CLI Deployment**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from web directory
cd apps/web
vercel

# Production deployment
vercel --prod
```

#### **Step 3: Vercel Configuration**

Create `apps/web/vercel.json`:

```json
{
  "name": "family-portal-web",
  "version": 2,
  "builds": [
    {
      "src": "dist/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "https://your-api-domain.com/api"
  }
}
```

#### **Step 4: Environment Variables in Vercel**

In Vercel dashboard, add:

- `VITE_API_URL` - Your production API URL
- `VITE_APP_NAME` - "Family Portal"
- `VITE_ENVIRONMENT` - "production"

### **API Deployment Options for Vercel**

#### **Option 1: Vercel Functions (Serverless)**

Convert API to serverless functions:

```bash
# Create api directory in web project
mkdir apps/web/api

# Each route becomes a function
# Example: apps/web/api/auth/login.ts
export default async function handler(req, res) {
  // Your API logic here
}
```

#### **Option 2: External API Hosting**

Deploy API separately to:

- **Railway**: `railway up`
- **Render**: Connect GitHub repo
- **DigitalOcean App Platform**: Deploy via dashboard
- **AWS/Azure/GCP**: Container services

### **Vercel Deployment Script**

```bash
# Add to package.json
"deploy:vercel": "cd apps/web && vercel --prod",
"deploy:vercel:preview": "cd apps/web && vercel"

# Deploy
npm run deploy:vercel
```

---

## 🧪 **Testing Guide**

### **Complete Testing Workflow**

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Open coverage report
npm run test:coverage:open    # Root level
cd apps/web && npm run test:coverage:open    # Web app
cd apps/api && npm run test:coverage:open    # API
```

### **Granular Testing**

#### **API Testing**

```bash
cd apps/api

# All API tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Specific test file
npm test -- tests/unit/auth.test.ts

# Watch mode
npm run test:watch

# Debug mode
npm test -- --detectOpenHandles --forceExit
```

#### **Web App Testing**

```bash
cd apps/web

# Run tests (watch mode by default)
npm test

# Run once (CI mode)
npm run test:run

# Visual test interface
npm run test:ui

# Specific test types
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests
npm run test:e2e           # End-to-end tests

# Specific test file
npm test Button.test.tsx
```

### **Testing Environments**

#### **Local Testing**

```bash
# Start test database
npm run dev:local           # Uses local MongoDB

# Run tests against local services
npm test
```

#### **Docker Testing**

```bash
# Start test environment with Docker
docker-compose -f docker-compose.test.yml up -d

# Run tests in container
docker-compose exec api npm test
docker-compose exec web npm test
```

#### **CI/CD Testing**

```bash
# GitHub Actions workflow (example)
npm ci                     # Clean install
npm run lint              # Code quality
npm run type-check        # TypeScript
npm test                  # All tests
npm run build            # Build verification
```

### **Test Database Management**

```bash
# Reset test database
cd apps/api
npm run db:reset

# Seed test data
npm run db:seed

# Clean test artifacts
npm run clean
```

### **Performance Testing**

```bash
# Load testing (if configured)
npm run test:performance

# Bundle size analysis
cd apps/web
npm run build:analyze
```

---

## 💻 **Local Development**

### **Development Workflow**

#### **Full Stack Development**

```bash
# Start everything (recommended)
npm run dev

# Monitors:
# - API: http://localhost:5000
# - Web: http://localhost:3000
# - Auto-reload on file changes
```

#### **Service-Specific Development**

```bash
# API development only
npm run dev:api
# Features:
# - Hot reload with tsx
# - MongoDB connection
# - Environment variables loaded
# - Debug mode available

# Web development only
npm run dev:web
# Features:
# - Vite dev server
# - Hot module replacement
# - Fast refresh for React
# - Proxy to API server
```

#### **Debug Mode Development**

```bash
# API with debugger
cd apps/api
npm run dev:debug
# Connect debugger to localhost:9229

# Web with debug output
cd apps/web
npm run dev:debug
```

### **Database Development**

#### **Local MongoDB**

```bash
# Start local MongoDB
mongod --dbpath ./data/db

# Connect to local database
npm run dev:local

# Database operations
npm run db:seed:admin       # Create admin user
npm run db:seed            # Seed test data
npm run db:reset           # Reset database
```

#### **MongoDB Atlas (Cloud)**

```bash
# Configure .env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/family_portal

# Start development
npm run dev
```

### **Code Quality During Development**

#### **Automatic Formatting**

```bash
# Format all code
npm run format

# Check formatting
npm run format:check

# Auto-fix linting issues
npm run lint:fix
```

#### **Type Checking**

```bash
# Check TypeScript without compilation
npm run type-check

# Watch mode type checking
cd apps/api && npm run type-check -- --watch
cd apps/web && npm run type-check -- --watch
```

#### **Pre-commit Workflow**

```bash
# Before committing
npm run lint              # Check code quality
npm run format            # Format code
npm run type-check        # Validate TypeScript
npm test                  # Run tests
```

### **Development Tools Integration**

#### **VS Code Configuration**

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "files.associations": {
    "*.env*": "dotenv"
  }
}
```

#### **Recommended VS Code Extensions**

- ESLint
- Prettier
- TypeScript Hero
- Thunder Client (API testing)
- MongoDB for VS Code
- Docker
- GitLens

### **Environment Management**

```bash
# Development environment
.env                    # Local development
.env.local             # Local overrides
.env.development       # Development-specific

# Testing environment
.env.test              # Test configuration

# Production environment
.env.production        # Production configuration
```

---

## 📚 **Complete Scripts Reference**

### **🏠 Root Package Scripts (32 total)**

#### **Development & Start**

```bash
npm run dev              # Start full development environment
npm run dev:api          # Start API development only
npm run dev:web          # Start web development only
npm run start            # Start production services
npm run start:api        # Start API production server
npm run start:web        # Start web preview server
```

#### **Building**

```bash
npm run build            # Build both API and web for production
npm run build:api        # Build API only
npm run build:web        # Build web app only
```

#### **Code Quality**

```bash
npm run lint             # Lint all code
npm run lint:fix         # Lint and auto-fix issues
npm run format           # Format all code with Prettier
npm run format:check     # Check if code is properly formatted
npm run type-check       # Run TypeScript type checking
```

#### **Testing**

```bash
npm test                 # Run all tests (API + Web)
npm run test:api         # Run API tests only
npm run test:web         # Run web tests only
npm run test:coverage    # Run tests with coverage report
npm run test:watch       # Run tests in watch mode
```

#### **Maintenance**

```bash
npm run clean            # Clean build artifacts and dependencies
npm run clean:deps       # Remove all node_modules folders
npm run reset            # Clean, reinstall, and rebuild everything
npm run setup            # Install dependencies and build
npm run preview          # Preview production build
```

#### **Database**

```bash
npm run db:seed:admin    # Seed admin user
npm run db:reset         # Reset database with admin seed
```

#### **Docker**

```bash
npm run docker:build     # Build Docker images
npm run docker:up        # Start services with Docker Compose
npm run docker:down      # Stop Docker services
npm run docker:logs      # View Docker logs
```

#### **Utilities**

```bash
npm run health-check     # Check if services are running
npm run deps:update      # Update all dependencies
npm run deps:audit       # Security audit of dependencies
```

### **🔧 API Package Scripts (28 total)**

#### **Development & Start**

```bash
npm run start            # Start API server (production)
npm run start:prod       # Start in production mode with optimizations
npm run dev              # Start in development mode with hot reload
npm run dev:local        # Start with local MongoDB
npm run dev:docker       # Start with Docker MongoDB
npm run dev:debug        # Start with Node.js debugger
```

#### **Building**

```bash
npm run build            # Compile TypeScript to JavaScript
npm run build:watch      # Compile with watch mode
```

#### **Testing**

```bash
npm run test             # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:coverage:open  # Open coverage report in browser
npm run test:unit        # Run only unit tests
npm run test:integration # Run only integration tests
```

#### **Code Quality**

```bash
npm run lint             # Lint TypeScript code
npm run lint:fix         # Lint and auto-fix issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run type-check       # TypeScript type checking without compilation
```

#### **Database Operations**

```bash
npm run seed-admin       # Create admin user
npm run activate-promotions  # Activate pending admin promotions
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with test data
npm run db:reset         # Reset database completely
```

#### **Utilities**

```bash
npm run clean            # Clean build artifacts
npm run preview          # Build and start for testing
npm run health-check     # Check API health endpoint
npm run logs             # View application logs
npm run deps:audit       # Security audit
```

### **🌐 Web Package Scripts (26 total)**

#### **Development & Start**

```bash
npm run dev              # Start Vite development server
npm run dev:host         # Start with network access (--host)
npm run dev:debug        # Start with debug output
npm run start            # Alias for preview
npm run preview          # Preview production build locally
npm run preview:host     # Preview with network access
```

#### **Building**

```bash
npm run build            # Build for production
npm run build:analyze    # Build and analyze bundle size
npm run build:watch      # Build in watch mode
```

#### **Testing**

```bash
npm run test             # Run tests (default Vitest watch mode)
npm run test:run         # Run tests once (no watch)
npm run test:watch       # Explicitly run in watch mode
npm run test:ui          # Run tests with Vitest UI
npm run test:coverage    # Generate coverage report
npm run test:coverage:open  # Open coverage in browser
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:e2e         # Run end-to-end tests only
```

#### **Code Quality**

```bash
npm run lint             # Lint React/TypeScript code
npm run lint:fix         # Lint and auto-fix issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run type-check       # TypeScript type checking
```

#### **Utilities**

```bash
npm run clean            # Clean build artifacts and cache
npm run health-check     # Check web app health
npm run deps:audit       # Security audit
```

---

## 🚨 **Troubleshooting**

### **Common Issues & Solutions**

#### **🔧 Installation Issues**

```bash
# Node version issues
node --version              # Check version (need 18+)
nvm use 18                 # Switch to Node 18 (if using nvm)

# Dependency conflicts
npm run clean:deps         # Remove all node_modules
npm install               # Reinstall dependencies

# Package-lock issues
rm package-lock.json
rm -rf node_modules
npm install
```

#### **🚀 Development Server Issues**

```bash
# Port already in use
lsof -ti:3000 | xargs kill -9    # Kill process on port 3000
lsof -ti:5000 | xargs kill -9    # Kill process on port 5000

# Cannot connect to database
npm run dev:local          # Use local MongoDB
# OR check MONGODB_URI in .env

# API not responding
npm run health-check       # Check API health
curl http://localhost:5000/health
```

#### **🧪 Test Failures**

```bash
# Clear test cache
npm run clean              # Clean build artifacts
npm test -- --clearCache  # Clear Jest cache

# Database connection in tests
# Ensure test database is separate
export NODE_ENV=test
npm run db:reset

# Timeout issues
npm test -- --testTimeout=10000
```

#### **🏗️ Build Issues**

```bash
# TypeScript compilation errors
npm run type-check         # Check TypeScript errors
npm run clean             # Clean previous builds
npm run build             # Rebuild

# Memory issues during build
export NODE_OPTIONS="--max_old_space_size=4096"
npm run build

# Vite build issues
cd apps/web
rm -rf dist node_modules/.vite
npm install
npm run build
```

#### **🐳 Docker Issues**

```bash
# Container not starting
docker-compose ps          # Check container status
docker-compose logs api    # Check specific service logs

# Port conflicts
docker-compose down        # Stop all containers
docker ps                 # Check running containers
docker stop $(docker ps -q)  # Stop all containers

# Volume issues
docker-compose down -v     # Remove volumes
docker volume prune        # Clean unused volumes
```

#### **🌐 Network & CORS Issues**

```bash
# CORS errors in development
# Check CORS_ORIGIN in .env
CORS_ORIGIN=http://localhost:3000

# API not reachable
# Check API URL in web app
VITE_API_URL=http://localhost:5000/api

# Network access for mobile testing
npm run dev:host           # Start with --host flag
npm run preview:host       # Preview with --host flag
```

#### **🔑 Environment & Configuration Issues**

```bash
# Environment variables not loading
# Check .env file exists and format
cat .env                   # View environment file

# JWT token issues
# Ensure JWT_SECRET is set and at least 32 characters
JWT_SECRET=$(openssl rand -base64 32)

# Database connection string
# Check MongoDB URI format
MONGODB_URI=mongodb://localhost:27017/family_portal
# OR for Atlas:
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/family_portal
```

### **🔍 Debugging Commands**

#### **Service Health Checks**

```bash
# API health
curl http://localhost:5000/health
npm run health-check

# Database connection
mongosh $MONGODB_URI --eval "db.stats()"

# Web app access
curl http://localhost:3000

# Docker services
docker-compose ps
docker-compose logs
```

#### **Performance Debugging**

```bash
# API performance
npm run logs               # View API logs
cd apps/api && npm run dev:debug  # Debug mode

# Web app performance
cd apps/web && npm run build:analyze  # Bundle analysis
cd apps/web && npm run dev:debug      # Debug mode

# Database performance
mongosh $MONGODB_URI --eval "db.runCommand({listCollections: 1})"
```

#### **Development Debugging**

```bash
# TypeScript issues
npm run type-check         # Check all TypeScript errors

# Linting issues
npm run lint              # Check linting errors
npm run lint:fix          # Auto-fix linting issues

# Test debugging
npm test -- --verbose     # Verbose test output
npm test -- --detectOpenHandles  # Detect hanging processes
```

### **🆘 Emergency Recovery**

#### **Nuclear Reset (Last Resort)**

```bash
# Complete reset of everything
npm run clean:deps         # Remove all node_modules
rm -rf .turbo              # Remove Turbo cache
rm package-lock.json       # Remove lock file
npm install               # Reinstall everything
npm run build             # Rebuild everything
npm test                  # Verify everything works
```

#### **Database Reset**

```bash
# Reset database completely
npm run db:reset
npm run db:seed:admin
```

#### **Docker Reset**

```bash
# Reset Docker environment
docker-compose down -v     # Stop and remove volumes
docker system prune -a     # Clean all Docker resources
npm run docker:build       # Rebuild images
npm run docker:up          # Start fresh
```

---

## 🎯 **Quick Reference Cards**

### **🚀 New Developer Setup**

```bash
git clone <repo>
cd family-portal
npm run setup
cp .env.example .env
# Edit .env with your settings
npm run dev
npm run db:seed:admin
```

### **💻 Daily Development**

```bash
npm run dev                # Start development
npm run lint:fix           # Fix code issues
npm test                   # Run tests
npm run format             # Format code
```

### **🏗️ Production Deployment**

```bash
npm run lint
npm run type-check
npm test
npm run build
npm run preview
# Deploy built artifacts
```

### **🐳 Docker Development**

```bash
npm run docker:build
npm run docker:up
npm run docker:logs
npm run docker:down
```

### **🧪 Testing Workflow**

```bash
npm test                   # All tests
npm run test:coverage      # With coverage
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
```

### **🚨 Troubleshooting**

```bash
npm run clean              # Clean builds
npm run reset              # Nuclear reset
npm run health-check       # Check services
npm run logs              # View logs
```

---

_This complete guide covers every aspect of development, deployment, and maintenance for the Family Portal application. Keep this guide handy and refer to specific sections based on your current task._

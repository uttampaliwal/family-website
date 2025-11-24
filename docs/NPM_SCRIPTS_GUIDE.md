# 📚 **NPM Scripts Guide - Family Portal**

## 🚀 **Quick Start Commands**

```bash
# Setup development environment
npm run setup

# Start development (both API + Web)
npm run dev

# Build for production
npm run build

# Run all tests
npm test

# Check code quality
npm run lint
```

---

## 🎯 **Complete Script Reference**

### **🏠 Root Package Scripts**

#### **Development**

- `npm run dev` - Start both API and web development servers
- `npm run dev:api` - Start only API development server
- `npm run dev:web` - Start only web development server

#### **Production**

- `npm run start` - Start both services in production mode
- `npm run start:api` - Start only API server
- `npm run start:web` - Start only web preview server

#### **Building**

- `npm run build` - Build both API and web for production
- `npm run build:api` - Build only API
- `npm run build:web` - Build only web app

#### **Code Quality**

- `npm run lint` - Lint all code
- `npm run lint:fix` - Lint and auto-fix issues
- `npm run format` - Format all code with Prettier
- `npm run format:check` - Check if code is properly formatted
- `npm run type-check` - Run TypeScript type checking

#### **Testing**

- `npm test` - Run all tests (API + Web)
- `npm run test:api` - Run only API tests
- `npm run test:web` - Run only web tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:watch` - Run tests in watch mode

#### **Maintenance**

- `npm run clean` - Clean all build artifacts and dependencies
- `npm run clean:deps` - Remove all node_modules folders
- `npm run reset` - Clean, reinstall, and rebuild everything
- `npm run setup` - Install dependencies and build
- `npm run preview` - Preview production build

#### **Database**

- `npm run db:seed:admin` - Seed admin user
- `npm run db:reset` - Reset database with admin seed

#### **Docker**

- `npm run docker:build` - Build Docker images
- `npm run docker:up` - Start services with Docker Compose
- `npm run docker:down` - Stop Docker services
- `npm run docker:logs` - View Docker logs

#### **Utilities**

- `npm run health-check` - Check if services are running
- `npm run deps:update` - Update all dependencies
- `npm run deps:audit` - Security audit of dependencies

---

### **🔧 API Package Scripts**

#### **Development**

- `npm run dev` - Start API in development mode with hot reload
- `npm run dev:local` - Start with local MongoDB
- `npm run dev:docker` - Start with Docker MongoDB
- `npm run dev:debug` - Start with Node.js debugger

#### **Production**

- `npm run start` - Start API server
- `npm run start:prod` - Start in production mode with optimizations

#### **Building**

- `npm run build` - Compile TypeScript to JavaScript
- `npm run build:watch` - Compile with watch mode

#### **Testing**

- `npm run test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:coverage:open` - Open coverage report in browser
- `npm run test:unit` - Run only unit tests
- `npm run test:integration` - Run only integration tests

#### **Code Quality**

- `npm run lint` - Lint TypeScript code
- `npm run lint:fix` - Lint and auto-fix issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - TypeScript type checking without compilation

#### **Database Operations**

- `npm run seed-admin` - Create admin user
- `npm run activate-promotions` - Activate pending admin promotions
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with test data
- `npm run db:reset` - Reset database completely

#### **Utilities**

- `npm run clean` - Clean build artifacts
- `npm run preview` - Build and start for testing
- `npm run health-check` - Check API health endpoint
- `npm run logs` - View application logs
- `npm run deps:audit` - Security audit

---

### **🌐 Web Package Scripts**

#### **Development**

- `npm run dev` - Start Vite development server
- `npm run dev:host` - Start with network access (--host)
- `npm run dev:debug` - Start with debug output

#### **Building**

- `npm run build` - Build for production
- `npm run build:analyze` - Build and analyze bundle size
- `npm run build:watch` - Build in watch mode

#### **Preview**

- `npm run start` - Alias for preview
- `npm run preview` - Preview production build locally
- `npm run preview:host` - Preview with network access

#### **Testing**

- `npm run test` - Run tests (default Vitest watch mode)
- `npm run test:run` - Run tests once (no watch)
- `npm run test:watch` - Explicitly run in watch mode
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:coverage` - Generate coverage report
- `npm run test:coverage:open` - Open coverage in browser
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests only
- `npm run test:e2e` - Run end-to-end tests only

#### **Code Quality**

- `npm run lint` - Lint React/TypeScript code
- `npm run lint:fix` - Lint and auto-fix issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - TypeScript type checking

#### **Utilities**

- `npm run clean` - Clean build artifacts and cache
- `npm run health-check` - Check web app health
- `npm run deps:audit` - Security audit

---

## 🛠️ **Development Workflow Examples**

### **Starting Development**

```bash
# Initial setup
npm run setup

# Start development
npm run dev

# Or start services separately
npm run dev:api    # Terminal 1
npm run dev:web    # Terminal 2
```

### **Code Quality Workflow**

```bash
# Before committing
npm run lint
npm run format
npm run type-check
npm test
```

### **Production Deployment**

```bash
# Build and test
npm run build
npm run test:coverage
npm run health-check

# Start production
npm run start
```

### **Database Management**

```bash
# Setup admin user
npm run db:seed:admin

# Reset everything
npm run db:reset
```

### **Docker Workflow**

```bash
# Build and start with Docker
npm run docker:build
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

---

## 🚨 **Troubleshooting Commands**

### **Clean Install**

```bash
npm run reset           # Nuclear option - clean everything
npm run clean:deps      # Remove node_modules only
npm run setup          # Reinstall and rebuild
```

### **Dependency Issues**

```bash
npm run deps:audit     # Check for security issues
npm run deps:update    # Update all dependencies
```

### **Build Issues**

```bash
npm run clean          # Clean build artifacts
npm run type-check     # Check TypeScript errors
npm run build          # Rebuild
```

### **Test Issues**

```bash
npm run test:unit      # Run unit tests only
npm run test:coverage  # Check test coverage
npm run test:watch     # Debug in watch mode
```

---

## 🎯 **Performance & Debugging**

### **Bundle Analysis**

```bash
cd apps/web
npm run build:analyze  # Analyze webpack bundle
```

### **Debug Mode**

```bash
npm run dev:debug      # API with debugger
npm run dev:debug      # Web with debug output
```

### **Health Monitoring**

```bash
npm run health-check   # Check if services are up
npm run logs          # View API logs
```

---

## ⚡ **Pro Tips**

1. **Parallel Development**: Use `npm run dev` to start both services at once
2. **Focused Testing**: Use specific test commands (`test:unit`, `test:integration`) for faster feedback
3. **Code Quality**: Run `npm run lint:fix && npm run format` before committing
4. **Production Testing**: Use `npm run preview` to test production builds locally
5. **Clean Builds**: Run `npm run clean` if you encounter build issues
6. **Docker Development**: Use `npm run docker:up` for consistent environment
7. **Performance**: Use `npm run build:analyze` to optimize bundle size

---

## 🚀 **Custom Scripts Location**

- **Setup Script**: `./scripts/dev-setup.sh`
- **Deploy Script**: `./scripts/production-deploy.sh`

Make scripts executable:

```bash
chmod +x scripts/*.sh
```

Run setup script:

```bash
./scripts/dev-setup.sh
```

---

_This comprehensive script collection provides everything needed for development, testing, deployment, and maintenance of the Family Portal application._

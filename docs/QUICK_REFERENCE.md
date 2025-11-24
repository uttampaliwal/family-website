# ⚡ **Quick Reference - Family Portal**

## 🚀 **One-Line Commands for Everything**

### **🆕 New PC Setup**

```bash
git clone <repo> && cd family-portal && npm run setup && cp .env.example .env
# Edit .env, then: npm run dev && npm run db:seed:admin
```

### **💻 Daily Development**

```bash
npm run dev          # Start everything
npm run lint:fix     # Fix code issues
npm test            # Run all tests
npm run format      # Format code
```

### **🏗️ Quick Production Deploy**

```bash
npm run lint && npm run type-check && npm test && npm run build && npm run preview
```

### **🐳 Docker in 3 Commands**

```bash
npm run docker:build && npm run docker:up && npm run docker:logs
```

---

## 📱 **Port Reference**

- **Web App**: http://localhost:3000
- **API Server**: http://localhost:5000
- **MongoDB**: mongodb://localhost:27017
- **API Health**: http://localhost:5000/health

---

## 🛠️ **Essential Scripts by Category**

### **🚀 Development**

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Start full development environment |
| `npm run dev:api`   | API development only               |
| `npm run dev:web`   | Frontend development only          |
| `npm run dev:debug` | Debug mode with inspector          |

### **🧪 Testing**

| Command                 | Description                 |
| ----------------------- | --------------------------- |
| `npm test`              | Run all tests               |
| `npm run test:coverage` | Tests with coverage report  |
| `npm run test:watch`    | Tests in watch mode         |
| `npm run test:ui`       | Visual test interface (web) |

### **🔧 Code Quality**

| Command              | Description             |
| -------------------- | ----------------------- |
| `npm run lint`       | Check code quality      |
| `npm run lint:fix`   | Auto-fix linting issues |
| `npm run format`     | Format all code         |
| `npm run type-check` | TypeScript validation   |

### **🏗️ Building & Deployment**

| Command                | Description              |
| ---------------------- | ------------------------ |
| `npm run build`        | Production builds        |
| `npm run preview`      | Test production build    |
| `npm run start`        | Start production servers |
| `npm run health-check` | Verify services          |

### **🐳 Docker Operations**

| Command                | Description          |
| ---------------------- | -------------------- |
| `npm run docker:build` | Build Docker images  |
| `npm run docker:up`    | Start with Docker    |
| `npm run docker:down`  | Stop Docker services |
| `npm run docker:logs`  | View container logs  |

### **🧹 Maintenance**

| Command               | Description                |
| --------------------- | -------------------------- |
| `npm run clean`       | Clean build artifacts      |
| `npm run reset`       | Nuclear reset + rebuild    |
| `npm run setup`       | Install & build everything |
| `npm run deps:update` | Update dependencies        |

### **💾 Database**

| Command                 | Description          |
| ----------------------- | -------------------- |
| `npm run db:seed:admin` | Create admin user    |
| `npm run db:reset`      | Reset database       |
| `npm run db:seed`       | Seed test data (API) |
| `npm run db:migrate`    | Run migrations (API) |

---

## 🔥 **Emergency Commands**

### **🚨 Something's Broken**

```bash
npm run reset        # Nuclear option - clean everything
npm run health-check # Check what's working
npm run logs        # See what's happening
```

### **🔧 Common Fixes**

```bash
# Port conflicts
lsof -ti:3000 | xargs kill -9    # Kill port 3000
lsof -ti:5000 | xargs kill -9    # Kill port 5000

# Dependency issues
npm run clean:deps               # Remove node_modules
npm install                     # Reinstall

# Docker issues
npm run docker:down -v          # Stop & remove volumes
docker system prune -a          # Clean everything
```

---

## 🎯 **Workflow Shortcuts**

### **📝 Before Committing**

```bash
npm run lint:fix && npm run format && npm run type-check && npm test
```

### **🚀 Deploy to Production**

```bash
./scripts/production-deploy.sh
# OR manually:
npm run lint && npm test && npm run build && npm run preview
```

### **☁️ Deploy to Vercel**

```bash
cd apps/web && vercel --prod
```

### **🔍 Debug Issues**

```bash
npm run health-check  # Check services
npm run logs         # View API logs
npm run test:coverage # Check test status
npm run type-check   # Check TypeScript
```

---

## 📚 **Documentation Quick Links**

- **[Complete Development Guide](COMPLETE_DEVELOPMENT_GUIDE.md)** - Full setup, Docker, production, Vercel
- **[NPM Scripts Guide](NPM_SCRIPTS_GUIDE.md)** - All 86+ scripts explained
- **[API Documentation](api-documentation.md)** - Backend API reference
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues & fixes

---

## 🎨 **Environment Files Quick Setup**

### **`.env` (Development)**

```bash
MONGODB_URI=mongodb://localhost:27017/family_portal
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
NODE_ENV=development
API_PORT=5000
VITE_API_URL=http://localhost:5000/api
```

### **`.env.production`**

```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/family_portal_prod
JWT_SECRET=your-production-jwt-secret-min-32-chars
NODE_ENV=production
API_PORT=5000
CORS_ORIGIN=https://yourdomain.com
```

---

## 🏃‍♂️ **Speed Run Guides**

### **⚡ 2-Minute Setup**

```bash
git clone <repo>
cd family-portal
npm run setup
cp .env.example .env
# Edit MONGODB_URI and JWT_SECRET
npm run dev
```

### **⚡ 30-Second Test**

```bash
npm test && npm run lint && npm run build
```

### **⚡ 1-Minute Deploy**

```bash
npm run build && npm run preview
# If good: deploy dist/ folder
```

---

_Keep this reference handy for instant access to any command you need! 🚀_

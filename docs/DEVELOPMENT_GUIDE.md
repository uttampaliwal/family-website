# 👩‍💻 Development Guide

## 🚀 **Quick Start**

### **Prerequisites**

- Node.js 20+ (Recommended: 22.14.0 LTS)
- npm 11+
- Docker & Docker Compose
- Git

### **Setup**

```bash
# Clone and install
git clone <repository-url>
cd family-website
npm install

# Start development environment
docker-compose up -d

# Access the application
# Frontend: http://localhost:5173
# API: http://localhost:3000
```

---

## 🏗️ **Project Structure**

```
family-website/
├── apps/
│   ├── api/                    # Backend (Express + TypeScript)
│   │   ├── src/
│   │   │   ├── controllers/    # Request handlers
│   │   │   ├── middleware/     # Security, logging, validation
│   │   │   ├── models/         # MongoDB schemas
│   │   │   ├── routes/         # API endpoints
│   │   │   └── utils/          # Utilities & helpers
│   │   └── Dockerfile.prod     # Production container
│   └── web/                    # Frontend (React + Vite)
│       ├── src/
│       │   ├── components/     # Reusable UI components
│       │   ├── pages/          # Route components
│       │   ├── hooks/          # Custom React hooks
│       │   ├── lib/            # Utilities & configurations
│       │   └── styles/         # CSS & theme files
│       └── Dockerfile.prod     # Production container
├── docs/                       # Documentation
└── docker-compose.yml         # Development environment
```

---

## 🛠️ **Development Workflow**

### **Available Scripts**

```bash
# Development
npm run dev         # Start all services
npm run dev:api     # Start API only
npm run dev:web     # Start frontend only

# Testing
npm test            # Run all tests
npm run test:api    # API tests only
npm run test:web    # Frontend tests only

# Code Quality
npm run lint        # ESLint check
npm run lint:fix    # Auto-fix linting issues
npm run type-check  # TypeScript validation

# Building
npm run build       # Build all apps
npm run build:api   # Build API only
npm run build:web   # Build frontend only
```

### **Environment Configuration**

```bash
# Copy example environment file
cp .env.example .env

# Required variables
MONGO_URI=mongodb://localhost:27017/family-website
JWT_SECRET=your-super-secret-jwt-key
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key
FRONTEND_URL=http://localhost:5173
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

---

## 🎨 **Theme System**

### **Color Palette**

```css
/* Beautiful beige/tan theme */
--color-background: 245 245 220; /* Beige */
--color-surface: 210 180 140; /* Tan */
--color-primary: 139 69 19; /* SaddleBrown */
--color-secondary: 255 215 0; /* Gold */
--color-accent: 255 99 71; /* Tomato */
```

### **Modern Effects**

- **Glass morphism navbar** with backdrop blur
- **Smooth animations** with Framer Motion
- **Hover effects** and micro-interactions
- **Responsive design** with Tailwind CSS

---

## 🔧 **Key Features Implemented**

### **Security**

- JWT authentication with refresh tokens
- Rate limiting (5-100 requests/15min)
- CSRF protection
- Input validation with Zod
- Security headers with Helmet

### **Performance**

- Structured logging with Pino
- Performance monitoring
- Optimized Docker builds
- Code splitting and lazy loading

### **Developer Experience**

- Hot module replacement
- TypeScript throughout
- Comprehensive error handling
- Modern form handling with React Hook Form

---

## 🧪 **Testing Strategy**

### **Backend Testing**

```bash
cd apps/api
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### **Frontend Testing**

```bash
cd apps/web
npm test                    # Run component tests
npm run test:ui            # UI tests
```

### **Integration Testing**

- API endpoint testing with Supertest
- Database testing with in-memory MongoDB
- Authentication flow testing

---

## 🐛 **Debugging**

### **Common Issues**

1. **Port conflicts**: Check if ports 3000/5173 are free
2. **Database connection**: Ensure MongoDB is running
3. **Environment variables**: Verify all required vars are set

### **Debugging Tools**

- **API**: Structured logs with Pino
- **Frontend**: React DevTools + React Query DevTools
- **Database**: MongoDB Compass
- **Network**: Browser DevTools Network tab

---

## 📦 **Adding New Features**

### **API Endpoints**

1. Create controller in `apps/api/src/controllers/`
2. Add route in `apps/api/src/routes/`
3. Add validation middleware
4. Write tests

### **Frontend Components**

1. Create component in `apps/web/src/components/`
2. Add to page in `apps/web/src/pages/`
3. Style with Tailwind classes
4. Add animations with Framer Motion

### **Database Models**

1. Define schema in `apps/api/src/models/`
2. Add validation with Mongoose
3. Create migration if needed

---

## 🔄 **Git Workflow**

### **Branch Strategy**

- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: New features
- `fix/*`: Bug fixes

### **Commit Convention**

```bash
feat: add new user authentication
fix: resolve navbar transparency issue
docs: update development guide
style: improve button hover effects
```

---

## 🚀 **Deployment**

### **Development**

```bash
docker-compose up -d
```

### **Production**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### **Environment-specific configs**

- Development: Hot reload, debug logging
- Production: Optimized builds, structured logging, SSL

---

**Happy coding! The development environment is optimized for productivity and modern workflows.** 🎉

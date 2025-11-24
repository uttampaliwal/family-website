# 🛠️ Troubleshooting Guide

## 🚨 **Common Issues & Solutions**

---

## 🔧 **Development Issues**

### **Port Conflicts**

**Problem**: `Port 5173 is already in use`

```bash
# Solution 1: Kill process using port
netstat -ano | findstr :5173
taskkill /PID <process-id> /F

# Solution 2: Use different port
# Edit vite.config.ts and change port number
```

### **Dependencies Issues**

**Problem**: `Module not found` or dependency conflicts

```bash
# Solution: Clean install
rm -rf node_modules package-lock.json
npm install

# For specific workspace
cd apps/api && rm -rf node_modules && npm install
cd apps/web && rm -rf node_modules && npm install
```

### **TypeScript Errors**

**Problem**: Type checking failures

```bash
# Check TypeScript errors
npm run type-check

# Common fixes
npm install @types/node --save-dev
npm install typescript@latest --save-dev
```

---

## 🐳 **Docker Issues**

### **Container Won't Start**

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]
```

### **Database Connection Failed**

**Problem**: `MongoNetworkError` or connection timeout

```bash
# Solution 1: Check MongoDB container
docker-compose logs mongo

# Solution 2: Restart MongoDB
docker-compose restart mongo

# Solution 3: Check environment variables
cat .env | grep MONGO_URI
```

### **Out of Disk Space**

```bash
# Clean Docker system
docker system prune -a

# Remove unused volumes
docker volume prune

# Remove unused images
docker image prune -a
```

---

## 🌐 **Frontend Issues**

### **Styling Not Applied**

**Problem**: CSS classes not working or theme not visible

```bash
# Solution 1: Hard refresh
Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

# Solution 2: Clear browser cache
# Open DevTools > Application > Storage > Clear storage

# Solution 3: Check Tailwind compilation
npm run build
```

### **API Calls Failing**

**Problem**: Network errors or CORS issues

```bash
# Check API server status
curl http://localhost:3000/api/health-check

# Check browser console for errors
# Open DevTools > Console

# Verify environment variables
echo $VITE_API_URL
```

### **Translucent Navbar Not Visible**

**Problem**: Glass morphism effect not showing

```bash
# Check browser support
# Chrome/Safari: Full support ✅
# Firefox: May need backdrop-filter flag ⚠️

# Force styles in DevTools
# Add: backdrop-filter: blur(15px) !important;
```

---

## 🔐 **Authentication Issues**

### **Login Failed**

**Problem**: Invalid credentials or JWT errors

```bash
# Check user exists in database
# MongoDB Compass or CLI

# Verify JWT secrets
cat .env | grep JWT_SECRET

# Check password hashing
# Ensure bcrypt is working correctly
```

### **Token Expired**

**Problem**: Frequent logout or token refresh issues

```bash
# Check token expiration times
# Access token: 15 minutes
# Refresh token: 7 days

# Verify refresh token endpoint
curl -X POST http://localhost:3000/api/auth/refresh-token
```

---

## 📊 **Performance Issues**

### **Slow Loading**

**Problem**: Application takes too long to load

```bash
# Check bundle size
npm run build
# Look for large chunks in dist/

# Analyze bundle
npm install --save-dev webpack-bundle-analyzer
npm run analyze

# Optimize images
# Use WebP format, compress images
```

### **Memory Leaks**

**Problem**: High memory usage or crashes

```bash
# Monitor memory usage
docker stats

# Check for memory leaks in code
# Use React DevTools Profiler
# Check for unclosed connections
```

---

## 🗄️ **Database Issues**

### **Connection Pool Exhausted**

**Problem**: Too many database connections

```bash
# Check connection pool settings
# Mongoose maxPoolSize: 10 (default)

# Monitor active connections
# MongoDB Compass > Performance tab

# Restart API to reset connections
docker-compose restart api
```

### **Data Migration Issues**

**Problem**: Schema changes or data corruption

```bash
# Backup before migration
mongodump --uri="mongodb://localhost:27017/family-website"

# Check data integrity
# Use MongoDB validation rules

# Restore from backup if needed
mongorestore --uri="mongodb://localhost:27017/family-website" backup/
```

---

## 🔍 **Debugging Tools**

### **Backend Debugging**

```bash
# Enable debug logging
NODE_ENV=development npm run dev

# Use structured logs
# Check logs in JSON format with Pino

# API testing
curl -X GET http://localhost:3000/api/health-check
```

### **Frontend Debugging**

```bash
# React DevTools
# Install browser extension

# React Query DevTools
# Available in development mode

# Network debugging
# Browser DevTools > Network tab
```

### **Database Debugging**

```bash
# MongoDB Compass GUI
# Connect to mongodb://localhost:27017

# Command line
docker exec -it mongo mongosh
# Use: show dbs, use family-website, show collections
```

---

## 📞 **Getting Help**

### **Log Collection**

```bash
# Collect all logs
docker-compose logs > debug-logs.txt

# System information
docker version
docker-compose version
node --version
npm --version
```

### **Error Reporting**

When reporting issues, include:

- [ ] Error message (full stack trace)
- [ ] Steps to reproduce
- [ ] Environment details (OS, Node version, etc.)
- [ ] Relevant logs
- [ ] Screenshots (for UI issues)

### **Useful Commands**

```bash
# Health check all services
docker-compose ps
curl http://localhost:3000/api/health-check
curl http://localhost:5173/health

# Reset everything
docker-compose down
docker system prune -a
docker-compose up -d

# Check resource usage
docker stats
free -h
df -h
```

---

**Most issues can be resolved with a clean restart and proper environment configuration!** 🎉

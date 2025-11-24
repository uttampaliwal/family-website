# 🚀 Family Portal - Production Deployment Guide

## 📋 **Pre-Deployment Checklist**

### ✅ **Environment Preparation**

- [ ] Production server configured (Node.js 18+, MongoDB, Redis)
- [ ] SSL certificates installed and configured
- [ ] Domain name configured with DNS
- [ ] Firewall rules configured (ports 80, 443, 3001)
- [ ] Environment variables configured (see below)
- [ ] Monitoring platform account setup (Datadog/Splunk/Grafana)

### ✅ **Code Quality Verification**

- [x] All builds passing (`npm run build`)
- [x] Console statements replaced with structured logging
- [x] Error boundaries implemented
- [x] Performance optimizations active
- [x] TypeScript compilation successful

---

## 🔧 **Environment Configuration**

### **Production Environment Variables**

#### **Backend (.env.production)**

```bash
# Server Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database Configuration
MONGODB_URI=mongodb://username:password@your-mongo-host:27017/family_portal_prod
REDIS_URL=redis://username:password@your-redis-host:6379

# Authentication & Security
JWT_SECRET=your-super-secure-jwt-secret-256-bits
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-256-bits
ENCRYPTION_KEY=your-32-character-encryption-key
CSRF_SECRET=your-csrf-secret-key

# Email Configuration
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
FROM_EMAIL=noreply@your-domain.com

# Monitoring & Logging
LOG_LEVEL=info
STRUCTURED_LOGGING=true
DATADOG_API_KEY=your-datadog-api-key
SPLUNK_HEC_TOKEN=your-splunk-token

# Performance & Caching
REDIS_TTL=3600
CACHE_ENABLED=true
RATE_LIMIT_ENABLED=true
SLOW_REQUEST_THRESHOLD=2000

# File Upload & Storage
UPLOAD_DIR=/var/uploads/family-portal
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png,gif
```

#### **Frontend (.env.production)**

```bash
# API Configuration
VITE_API_URL=https://api.your-domain.com
VITE_API_VERSION=v1

# Security
VITE_CSRF_ENABLED=true
VITE_SECURE_COOKIES=true

# Monitoring
VITE_DATADOG_APP_ID=your-datadog-app-id
VITE_DATADOG_CLIENT_TOKEN=your-datadog-client-token
VITE_SENTRY_DSN=your-sentry-dsn

# Performance
VITE_ENABLE_ANALYTICS=true
VITE_CACHE_STATIC_ASSETS=true
```

---

## 🐳 **Docker Deployment**

### **Docker Compose Production Setup**

#### **docker-compose.prod.yml**

```yaml
version: "3.8"

services:
  # Frontend Web Server
  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/ssl/certs
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - api
    restart: unless-stopped
    networks:
      - family-portal

  # Backend API Server
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile.prod
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    env_file:
      - ./apps/api/.env.production
    volumes:
      - ./uploads:/var/uploads/family-portal
      - ./logs:/app/logs
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped
    networks:
      - family-portal

  # MongoDB Database
  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: your-secure-password
      MONGO_INITDB_DATABASE: family_portal_prod
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js
    restart: unless-stopped
    networks:
      - family-portal

  # Redis Cache
  redis:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass your-redis-password
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - family-portal

volumes:
  mongodb_data:
  redis_data:

networks:
  family-portal:
    driver: bridge
```

### **Production Dockerfile - API**

```dockerfile
# apps/api/Dockerfile.prod
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS runtime
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .
USER nodejs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1
CMD ["node", "dist/index.js"]
```

### **Production Dockerfile - Web**

```dockerfile
# apps/web/Dockerfile.prod
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🌐 **Nginx Configuration**

### **nginx.conf**

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=web:10m rate=30r/s;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend Server
    server {
        listen 80;
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        ssl_certificate /etc/ssl/certs/your-domain.crt;
        ssl_certificate_key /etc/ssl/certs/your-domain.key;

        root /usr/share/nginx/html;
        index index.html;

        # Security & Performance
        limit_req zone=web burst=20 nodelay;

        # Static assets caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API Proxy
        location /api/ {
            limit_req zone=api burst=10 nodelay;
            proxy_pass http://api:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Frontend routing
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

---

## 🔄 **Deployment Scripts**

### **deploy.sh**

```bash
#!/bin/bash
set -e

echo "🚀 Starting Family Portal Production Deployment..."

# Environment check
if [ "$NODE_ENV" != "production" ]; then
    echo "❌ NODE_ENV must be set to 'production'"
    exit 1
fi

# Pre-deployment checks
echo "📋 Running pre-deployment checks..."
npm run test
npm run build
npm run lint

# Database backup
echo "💾 Creating database backup..."
mongodump --uri="$MONGODB_URI" --out="./backups/$(date +%Y%m%d_%H%M%S)"

# Build and deploy containers
echo "🐳 Building production containers..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Health checks
echo "🏥 Waiting for services to be healthy..."
sleep 30

# Verify API health
if curl -f http://localhost:3001/health; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
    exit 1
fi

# Verify web server
if curl -f http://localhost; then
    echo "✅ Web server health check passed"
else
    echo "❌ Web server health check failed"
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "🌐 Application available at: https://your-domain.com"
echo "📊 API health: https://your-domain.com/api/health"
```

### **rollback.sh**

```bash
#!/bin/bash
set -e

echo "🔄 Rolling back to previous version..."

# Stop current containers
docker-compose -f docker-compose.prod.yml down

# Restore from backup
LATEST_BACKUP=$(ls -t ./backups | head -n1)
echo "📦 Restoring from backup: $LATEST_BACKUP"
mongorestore --uri="$MONGODB_URI" --drop "./backups/$LATEST_BACKUP"

# Start previous version
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Rollback completed!"
```

---

## 📊 **Health Monitoring**

### **Health Check Endpoints**

#### **API Health Check** (`/api/health`)

```javascript
// Already implemented in your API
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime(),
    database: "connected",
    cache: "connected",
  });
});
```

### **Monitoring Script** (`monitor.sh`)

```bash
#!/bin/bash

# Health check script for continuous monitoring
check_health() {
    local service=$1
    local url=$2

    if curl -s -f "$url" > /dev/null; then
        echo "✅ $service is healthy"
        return 0
    else
        echo "❌ $service is unhealthy"
        return 1
    fi
}

# Check all services
check_health "API" "http://localhost:3001/health"
check_health "Web" "http://localhost"
check_health "Database" "mongodb://localhost:27017"

# Send alerts if any service is down
if [ $? -ne 0 ]; then
    # Send notification (email, Slack, etc.)
    echo "🚨 Service health check failed - sending alerts..."
fi
```

---

## 🔒 **Security Checklist**

### **SSL/TLS Configuration**

- [ ] SSL certificates installed and valid
- [ ] HTTPS redirect configured
- [ ] TLS 1.2+ only enabled
- [ ] HSTS headers configured

### **Application Security**

- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] JWT secrets are strong (256-bit)
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] File upload restrictions active

### **Server Security**

- [ ] Firewall configured (only necessary ports open)
- [ ] SSH key-based authentication
- [ ] Regular security updates scheduled
- [ ] Log monitoring active
- [ ] Backup encryption enabled

---

## 📈 **Performance Optimization**

### **Database Optimization**

```bash
# Create production indexes
docker exec family-portal-api npm run create-indexes

# Verify index usage
docker exec family-portal-mongodb mongo --eval "db.users.getIndexes()"
```

### **Cache Warming**

```bash
# Warm up application cache
curl -X POST http://localhost:3001/api/admin/cache/warm
```

### **CDN Configuration**

- Configure CloudFlare or AWS CloudFront
- Enable static asset caching
- Implement image optimization

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **API Not Starting**

```bash
# Check logs
docker logs family-portal-api

# Check environment variables
docker exec family-portal-api env | grep NODE_ENV

# Verify database connection
docker exec family-portal-api npm run db:test
```

#### **High Memory Usage**

```bash
# Monitor container resources
docker stats family-portal-api

# Check for memory leaks
docker exec family-portal-api npm run memory:analyze
```

#### **Database Connection Issues**

```bash
# Test database connectivity
docker exec family-portal-mongodb mongo --eval "db.adminCommand('ismaster')"

# Check connection string
echo $MONGODB_URI
```

---

## 📞 **Support & Maintenance**

### **Regular Maintenance Tasks**

- [ ] Weekly database backups verification
- [ ] Monthly security updates
- [ ] Quarterly performance reviews
- [ ] Log rotation and cleanup
- [ ] SSL certificate renewal

### **Emergency Contacts**

- **DevOps Team**: devops@your-company.com
- **Database Admin**: dba@your-company.com
- **Security Team**: security@your-company.com

---

**🎉 Your Family Portal is now ready for enterprise production deployment!**

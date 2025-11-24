# 🚀 Production Deployment Guide

## 📋 **Prerequisites**

- Docker & Docker Compose
- SSL certificates (for HTTPS)
- Domain name configured
- Server with minimum 2GB RAM, 2 CPU cores

---

## 🔧 **Environment Setup**

### **1. Environment Variables**

```bash
# Copy and configure production environment
cp .env.example .env.prod

# Required production variables
NODE_ENV=production
MONGO_URI=mongodb://admin:password@mongo:27017/family-website?authSource=admin
JWT_SECRET=your-super-secure-64-character-jwt-secret-key-here
REFRESH_TOKEN_SECRET=your-super-secure-64-character-refresh-secret-key
FRONTEND_URL=https://your-domain.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
REDIS_PASSWORD=your-secure-redis-password
```

### **2. Generate Secure Secrets**

```bash
# Generate strong secrets
openssl rand -base64 64  # For JWT secrets
openssl rand -base64 32  # For Redis password
```

---

## 🐳 **Docker Production Deployment**

### **Quick Start**

```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### **Production Stack**

- **MongoDB 7.0**: Database with authentication
- **Redis 7**: Caching and session storage
- **API**: Node.js with production optimizations
- **Web**: Nginx with optimized static serving
- **Health Checks**: Comprehensive monitoring

---

## 🌐 **SSL & Domain Setup**

### **Nginx Configuration**

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;

    location / {
        proxy_pass http://web:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://api:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### **SSL Certificate (Let's Encrypt)**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 **Monitoring & Health Checks**

### **Health Endpoints**

- **API**: `https://your-domain.com/api/health-check`
- **Web**: `https://your-domain.com/health`

### **Monitoring Commands**

```bash
# Check container health
docker-compose -f docker-compose.prod.yml ps

# View resource usage
docker stats

# Check logs
docker-compose -f docker-compose.prod.yml logs api
docker-compose -f docker-compose.prod.yml logs web
```

---

## 💾 **Database Backup**

### **Automated Backup Script**

```bash
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
mkdir -p $BACKUP_DIR

docker exec family-website-mongo-prod mongodump \
  --username $MONGO_ROOT_USERNAME \
  --password $MONGO_ROOT_PASSWORD \
  --authenticationDatabase admin \
  --db family-website \
  --out /tmp/backup_$DATE

docker cp family-website-mongo-prod:/tmp/backup_$DATE $BACKUP_DIR/
docker exec family-website-mongo-prod rm -rf /tmp/backup_$DATE

echo "Backup completed: $BACKUP_DIR/backup_$DATE"
```

### **Schedule Backups**

```bash
# Add to crontab
0 2 * * * /path/to/backup-db.sh
```

---

## 🔄 **Updates & Maintenance**

### **Update Application**

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Clean up old images
docker image prune -f
```

### **Zero-Downtime Deployment**

```bash
# Rolling update script
docker-compose -f docker-compose.prod.yml up -d --no-deps api
docker-compose -f docker-compose.prod.yml up -d --no-deps web
```

---

## 🛡️ **Security Checklist**

- [ ] SSL/TLS certificates configured and auto-renewing
- [ ] Strong passwords and secrets (64+ characters)
- [ ] Database authentication enabled
- [ ] Rate limiting configured (5-100 req/15min)
- [ ] Security headers enabled (Helmet.js)
- [ ] Regular security updates scheduled
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting setup
- [ ] Firewall configured (ports 80, 443, 22 only)
- [ ] Non-root Docker containers

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Container Won't Start**

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs [service-name]

# Check resource usage
docker stats
free -h
df -h
```

#### **Database Connection Issues**

```bash
# Test MongoDB connection
docker exec -it family-website-mongo-prod mongosh
# Use: db.adminCommand('ping')
```

#### **SSL Certificate Issues**

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew --dry-run
```

### **Emergency Recovery**

```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Remove problematic containers
docker-compose -f docker-compose.prod.yml rm -f

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 📈 **Performance Optimization**

### **Production Optimizations**

- **Gzip compression** enabled
- **Static asset caching** (1 year)
- **Database connection pooling** (10 connections)
- **Redis caching** for sessions
- **CDN integration** ready

### **Scaling Options**

- **Horizontal scaling**: Multiple API instances
- **Load balancer**: Nginx or HAProxy
- **Database clustering**: MongoDB replica sets
- **CDN**: CloudFlare or AWS CloudFront

---

**Your family website is now production-ready with enterprise-grade deployment!** 🎉

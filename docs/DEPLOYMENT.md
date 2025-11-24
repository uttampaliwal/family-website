# 🚀 Deployment Guide

This guide covers deploying the Family Website application in various environments.

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- MongoDB 7.0+
- Redis 7+ (for production)
- SSL certificates (for production HTTPS)

## 🏗️ Environment Setup

### 1. Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

#### Required Environment Variables

```bash
# Database
MONGO_URI=mongodb://localhost:27017/family-website
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password
MONGO_DB_NAME=family-website

# JWT Secrets (generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-here-make-it-long-and-random

# Server Configuration
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-domain.com

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Redis (for production)
REDIS_PASSWORD=your-redis-password
REDIS_URL=redis://:your-redis-password@redis:6379

# Security
CSRF_SECRET=your-csrf-secret-key-here

# Performance
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Generate Secure Secrets

Use these commands to generate secure secrets:

```bash
# JWT Secret
openssl rand -base64 64

# CSRF Secret
openssl rand -base64 32

# Redis Password
openssl rand -base64 32
```

## 🐳 Docker Deployment

### Development Environment

```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop environment
docker-compose down
```

### Production Environment

```bash
# Create production environment file
cp .env.example .env.prod

# Edit production configuration
nano .env.prod

# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production environment
docker-compose -f docker-compose.prod.yml down
```

## 🌐 Production Deployment

### 1. Server Setup

#### Ubuntu/Debian Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx (for reverse proxy)
sudo apt install nginx -y

# Install Certbot (for SSL)
sudo apt install certbot python3-certbot-nginx -y
```

### 2. SSL Certificate Setup

```bash
# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### 3. Nginx Configuration

Create `/etc/nginx/sites-available/family-website`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy to Docker containers
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/family-website /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Deploy Application

```bash
# Clone repository
git clone https://github.com/your-username/family-website.git
cd family-website

# Configure environment
cp .env.example .env.prod
nano .env.prod

# Start production deployment
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

## 🔄 CI/CD Deployment

### GitHub Actions Deployment

The project includes automated CI/CD with GitHub Actions. To set up:

1. **Configure Secrets** in your GitHub repository:

   ```
   DOCKER_USERNAME
   DOCKER_PASSWORD
   VITE_API_URL
   ```

2. **Configure Environments**:
   - Create `staging` and `production` environments
   - Add environment-specific secrets

3. **Deploy**:
   - Push to `develop` branch → deploys to staging
   - Push to `main` branch → deploys to production

### Manual Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Pull latest changes
git pull origin main

# Build and deploy
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --remove-orphans

# Clean up old images
docker image prune -f

echo "✅ Deployment completed successfully!"
```

Make it executable:

```bash
chmod +x deploy.sh
./deploy.sh
```

## 📊 Monitoring and Maintenance

### Health Checks

```bash
# Check application health
curl https://your-domain.com/api/health-check

# Check container status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

### Database Backup

```bash
# Create backup script
cat > backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
mkdir -p $BACKUP_DIR

docker exec family-website-mongo-prod mongodump \
  --username $MONGO_ROOT_USERNAME \
  --password $MONGO_ROOT_PASSWORD \
  --authenticationDatabase admin \
  --db $MONGO_DB_NAME \
  --out /tmp/backup_$DATE

docker cp family-website-mongo-prod:/tmp/backup_$DATE $BACKUP_DIR/
docker exec family-website-mongo-prod rm -rf /tmp/backup_$DATE

echo "Backup completed: $BACKUP_DIR/backup_$DATE"
EOF

chmod +x backup-db.sh
```

### Log Rotation

```bash
# Configure log rotation
sudo tee /etc/logrotate.d/docker-containers << 'EOF'
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size 10M
    missingok
    delaycompress
    copytruncate
}
EOF
```

## 🔧 Troubleshooting

### Common Issues

1. **Container won't start**:

   ```bash
   docker-compose -f docker-compose.prod.yml logs [service-name]
   ```

2. **Database connection issues**:

   ```bash
   docker exec -it family-website-mongo-prod mongosh
   ```

3. **SSL certificate issues**:

   ```bash
   sudo certbot certificates
   sudo certbot renew
   ```

4. **Performance issues**:
   ```bash
   docker stats
   htop
   ```

### Emergency Recovery

```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Remove problematic containers
docker-compose -f docker-compose.prod.yml rm -f

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

## 📈 Scaling

### Horizontal Scaling

For high-traffic scenarios, consider:

1. **Load Balancer**: Use Nginx or HAProxy
2. **Multiple API Instances**: Scale API containers
3. **Database Clustering**: MongoDB replica sets
4. **CDN**: CloudFlare or AWS CloudFront
5. **Caching**: Redis for session storage and caching

### Performance Optimization

1. **Enable Gzip**: Already configured in Nginx
2. **Static Asset Caching**: CDN for static files
3. **Database Indexing**: Optimize MongoDB queries
4. **Connection Pooling**: Already configured in Mongoose
5. **Memory Monitoring**: Use the built-in performance monitoring

## 🔒 Security Checklist

- [ ] SSL/TLS certificates configured
- [ ] Strong passwords and secrets
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Database authentication enabled
- [ ] Regular security updates
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting setup
- [ ] Firewall configured
- [ ] Access logs monitored

## 📞 Support

For deployment issues:

1. Check the logs first
2. Review this documentation
3. Check GitHub Issues
4. Create a new issue with deployment details

---

**Happy Deploying! 🎉**

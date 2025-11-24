# Local MongoDB Setup for Development

## 🎯 **Why This is Perfect for You**

- ✅ **Keep all existing code** (no changes needed)
- ✅ **Unlimited storage** (your SSD capacity)
- ✅ **Fast development** (no network latency)
- ✅ **Free** (no cloud costs)
- ✅ **Full control** (your data stays local)

---

## 🚀 **Setup Instructions**

### **Windows Setup**

```bash
# 1. Download MongoDB Community Server
# Go to: https://www.mongodb.com/try/download/community
# Download Windows version

# 2. Install MongoDB
# Run the installer, choose "Complete" installation
# Install as Windows Service (recommended)

# 3. Create data directory on your SSD
mkdir D:\mongodb-data  # or wherever your SSD is mounted

# 4. Start MongoDB with custom data path
mongod --dbpath D:\mongodb-data --port 27017

# 5. Test connection
mongo mongodb://localhost:27017/family-portal
```

### **Mac Setup**

```bash
# 1. Install MongoDB using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# 2. Create data directory
sudo mkdir -p /path/to/your/ssd/mongodb-data
sudo chown $(whoami) /path/to/your/ssd/mongodb-data

# 3. Start MongoDB
mongod --dbpath /path/to/your/ssd/mongodb-data --port 27017

# 4. Test connection
mongo mongodb://localhost:27017/family-portal
```

### **Linux Setup**

```bash
# 1. Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# 2. Create data directory
sudo mkdir -p /path/to/your/ssd/mongodb-data
sudo chown mongodb:mongodb /path/to/your/ssd/mongodb-data

# 3. Start MongoDB
sudo mongod --dbpath /path/to/your/ssd/mongodb-data --port 27017

# 4. Test connection
mongo mongodb://localhost:27017/family-portal
```

---

## 🔧 **Update Your Environment**

### **Development Environment (.env)**

```env
# Local MongoDB (no authentication needed)
NODE_ENV=development
MONGO_HOST=localhost
MONGO_DB_NAME=family-portal
MONGO_URI=mongodb://localhost:27017/family-portal

# Remove these for local development
# MONGO_APP_USERNAME=
# MONGO_APP_PASSWORD=

# Keep other variables
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
REFRESH_TOKEN_SECRET=another-super-secret-refresh-key-also-32-chars-long
FRONTEND_URL=http://localhost:5173
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### **Update Environment Config**

Your `apps/api/src/config/environment.ts` already handles this perfectly:

```typescript
// Line 47-50: Already configured for local development!
if (process.env.NODE_ENV === "development" && host === "localhost") {
  // Local development against local MongoDB
  return `mongodb://localhost:27017/${database}`;
}
```

**No code changes needed!** 🎉

---

## 📁 **File Storage Strategy**

### **Development: Local File Storage**

```javascript
// Create uploads directory on your SSD
const uploadsPath =
  process.env.NODE_ENV === "development"
    ? "/path/to/your/ssd/family-website-uploads"
    : "./uploads";

// Store files locally during development
app.use("/uploads", express.static(uploadsPath));
```

### **Production: Cloud Storage (Later)**

```javascript
// When ready for production, switch to:
// - AWS S3 for large files
// - Cloudinary for images
// - MongoDB Atlas for database
```

---

## 🎯 **Development Workflow**

### **Daily Development**

```bash
# 1. Start MongoDB locally
mongod --dbpath /path/to/your/ssd/mongodb-data

# 2. Start your API
cd apps/api
npm run dev:local

# 3. Start frontend
cd apps/web
npm run dev

# 4. Develop with unlimited storage!
```

### **Data Management**

```bash
# Backup your data
mongodump --db family-portal --out /path/to/backups/

# Restore data
mongorestore --db family-portal /path/to/backups/family-portal/

# View data
mongo mongodb://localhost:27017/family-portal
```

---

## 💰 **Storage Capacity**

### **Your SSD Capacity**

- **Database**: Can grow to your full SSD size
- **Files**: Store directly on SSD
- **Backups**: Local backup strategy
- **Cost**: $0

### **Example Storage Usage**

- **20 family members** × **20GB each** = **400GB**
- **Database metadata**: ~1GB
- **Total**: ~401GB (easily fits on modern SSDs)

---

## 🚀 **Production Migration (When Ready)**

### **Phase 1: Current (Development)**

- Local MongoDB on SSD
- Local file storage
- Unlimited capacity
- $0 cost

### **Phase 2: Production (Future)**

- MongoDB Atlas M10+ ($57/month for 100GB)
- AWS S3 ($10/month for 400GB)
- Total: ~$67/month

### **Phase 3: Self-Hosted (Alternative)**

- VPS with large storage ($20-40/month)
- Self-managed MongoDB
- Total: $20-40/month

---

## ✅ **Next Steps**

1. **Install MongoDB locally** on your machine
2. **Point data directory** to your SSD
3. **Update .env** to use local MongoDB
4. **Test your existing API** (should work unchanged!)
5. **Develop with unlimited storage**

**Want me to help you set up local MongoDB or would you prefer to handle it independently?**

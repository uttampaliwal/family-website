# 🗄️ MongoDB Connection Check Guide

## 🎯 **Checking MongoDB Connection in Development (Without Docker)**

---

## 📋 **Prerequisites**

### **1. Install MongoDB Locally**

```bash
# Windows (using Chocolatey)
choco install mongodb

# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb

# Or download from: https://www.mongodb.com/try/download/community
```

### **2. Start MongoDB Service**

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
# or
mongod --dbpath /usr/local/var/mongodb
```

---

## 🔍 **Method 1: Check API Connection**

### **Step 1: Start API Server**

```bash
cd apps/api
npm install
npm run dev
```

### **Step 2: Check Health Endpoint**

```bash
# Test API health check
curl http://localhost:3000/api/health-check

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 45,
  "memory": { "rss": 50, "heapUsed": 30, "heapTotal": 45 },
  "database": "connected"  # ← This confirms DB connection
}
```

### **Step 3: Check API Logs**

Look for these log messages in your terminal:

```bash
✅ "MongoDB connection established successfully"
✅ "🚀 Server started successfully"
❌ "Failed to connect to MongoDB" (if there's an issue)
```

---

## 🔍 **Method 2: Direct Database Connection Test**

### **Step 1: Use MongoDB Compass (GUI)**

```bash
# Download MongoDB Compass: https://www.mongodb.com/products/compass
# Connection string: mongodb://localhost:27017/family-website
```

### **Step 2: Use MongoDB Shell**

```bash
# Connect to MongoDB
mongosh

# Switch to your database
use family-website

# Check if database exists
show dbs

# Check collections
show collections

# Test a simple query
db.users.find().limit(1)
```

### **Step 3: Test Connection with Node.js Script**

Create a test file:

```javascript
// test-db-connection.js
const mongoose = require("mongoose");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/family-website";

async function testConnection() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected successfully!");

    // Test a simple operation
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "📁 Available collections:",
      collections.map((c) => c.name),
    );

    await mongoose.disconnect();
    console.log("✅ Connection test completed");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
  }
}

testConnection();
```

Run the test:

```bash
cd apps/api
node test-db-connection.js
```

---

## 🔍 **Method 3: Check Web App Connection**

### **Step 1: Start Web Development Server**

```bash
cd apps/web
npm install
npm run dev
```

### **Step 2: Open Browser Developer Tools**

```bash
# Open: http://localhost:5173
# Press F12 to open DevTools
# Go to Network tab
```

### **Step 3: Test API Calls**

```bash
# Try to register/login or make any API call
# Check Network tab for API requests to localhost:3000
# Look for successful responses (200 status codes)
```

### **Step 4: Check Console for Errors**

Look for these in browser console:

```bash
✅ Successful API calls to localhost:3000
❌ "Network Error" or "Connection refused" (if API is down)
❌ "CORS error" (if CORS is misconfigured)
```

---

## 🔍 **Method 4: Environment Variable Check**

### **Step 1: Verify Environment Variables**

```bash
# Check if .env file exists
cat .env

# Look for MongoDB configuration
grep MONGO_URI .env

# Expected:
MONGO_URI=mongodb://localhost:27017/family-website
```

### **Step 2: Test Environment Loading**

```bash
cd apps/api
node -e "require('dotenv').config(); console.log('MONGO_URI:', process.env.MONGO_URI)"
```

---

## 🔍 **Method 5: Port and Service Check**

### **Step 1: Check if MongoDB is Running**

```bash
# Windows
netstat -an | findstr :27017

# macOS/Linux
netstat -an | grep :27017
lsof -i :27017

# Expected output: Something listening on port 27017
```

### **Step 2: Check MongoDB Process**

```bash
# Windows
tasklist | findstr mongod

# macOS/Linux
ps aux | grep mongod
```

### **Step 3: Check MongoDB Status**

```bash
# Windows
sc query MongoDB

# macOS/Linux
sudo systemctl status mongod
```

---

## 🛠️ **Troubleshooting Common Issues**

### **Issue 1: MongoDB Not Running**

```bash
# Start MongoDB service
# Windows:
net start MongoDB

# macOS/Linux:
sudo systemctl start mongod
# or manually:
mongod --dbpath /usr/local/var/mongodb
```

### **Issue 2: Connection Refused**

```bash
# Check if port 27017 is free
netstat -an | findstr :27017

# If nothing shows, MongoDB isn't running
# If something else is using port 27017, change MongoDB port
```

### **Issue 3: Database Not Found**

```bash
# MongoDB creates databases automatically when first used
# Just ensure your MONGO_URI includes the database name:
MONGO_URI=mongodb://localhost:27017/family-website
```

### **Issue 4: Permission Issues**

```bash
# Windows: Run as Administrator
# macOS/Linux: Check MongoDB data directory permissions
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chown mongodb:mongodb /tmp/mongodb-27017.sock
```

---

## ✅ **Complete Connection Test Script**

Create this comprehensive test:

```javascript
// complete-connection-test.js
const mongoose = require("mongoose");
const axios = require("axios");

async function fullConnectionTest() {
  console.log("🔍 Starting comprehensive connection test...\n");

  // Test 1: Direct MongoDB connection
  console.log("1️⃣ Testing direct MongoDB connection...");
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/family-website",
    );
    console.log("✅ Direct MongoDB connection: SUCCESS");
  } catch (error) {
    console.log("❌ Direct MongoDB connection: FAILED -", error.message);
    return;
  }

  // Test 2: Database operations
  console.log("\n2️⃣ Testing database operations...");
  try {
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log("✅ Database operations: SUCCESS");
    console.log(
      "📁 Collections found:",
      collections.map((c) => c.name),
    );
  } catch (error) {
    console.log("❌ Database operations: FAILED -", error.message);
  }

  // Test 3: API health check
  console.log("\n3️⃣ Testing API health endpoint...");
  try {
    const response = await axios.get("http://localhost:3000/api/health-check");
    console.log("✅ API health check: SUCCESS");
    console.log("📊 API status:", response.data.status);
  } catch (error) {
    console.log("❌ API health check: FAILED -", error.message);
    console.log("💡 Make sure API server is running: npm run dev");
  }

  // Test 4: Web app connectivity
  console.log("\n4️⃣ Testing web app connectivity...");
  try {
    const response = await axios.get("http://localhost:5173");
    console.log("✅ Web app connectivity: SUCCESS");
  } catch (error) {
    console.log("❌ Web app connectivity: FAILED -", error.message);
    console.log("💡 Make sure web server is running: npm run dev");
  }

  await mongoose.disconnect();
  console.log("\n🎉 Connection test completed!");
}

fullConnectionTest();
```

Run it:

```bash
cd apps/api
npm install axios  # if not already installed
node complete-connection-test.js
```

---

## 📊 **Expected Results**

### **✅ Successful Connection**

```bash
✅ Direct MongoDB connection: SUCCESS
✅ Database operations: SUCCESS
📁 Collections found: ['users', 'documents']
✅ API health check: SUCCESS
📊 API status: healthy
✅ Web app connectivity: SUCCESS
🎉 Connection test completed!
```

### **❌ Failed Connection**

```bash
❌ Direct MongoDB connection: FAILED - connect ECONNREFUSED 127.0.0.1:27017
💡 Solution: Start MongoDB service
```

---

**This comprehensive guide will help you verify that MongoDB is properly connected to both your API and web application in development!** 🎉

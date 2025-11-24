# 🚀 Deploy Family Website API to Render (FREE)

## ✅ Pre-Deployment Status

- **API Framework**: Express.js + TypeScript ✅
- **Database**: MongoDB (needs Atlas setup) 🔄
- **Port Configuration**: Dynamic PORT support ✅
- **Start Script**: Added to package.json ✅
- **Build Process**: TypeScript → JavaScript ✅

---

## 🎯 **Step 1: MongoDB Atlas Setup (FREE)**

### **Create Free MongoDB Database**

1. **Go to MongoDB Atlas**: [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Sign Up**: Create free account (no credit card required)
3. **Create Cluster**:
   - Choose **M0 Sandbox** (FREE forever)
   - Select **AWS** provider
   - Choose closest region
   - Cluster Name: `family-website-cluster`

4. **Create Database User**:
   - Username: `family-app-user`
   - Password: Generate strong password (save it!)
   - Database User Privileges: `Read and write to any database`

5. **Network Access**:
   - Add IP Address: `0.0.0.0/0` (Allow access from anywhere)
   - Description: `Render deployment access`

6. **Get Connection String**:
   - Click **Connect** → **Connect your application**
   - Copy connection string:
   ```
   mongodb+srv://family-app-user:<password>@family-website-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

---

## 🎯 **Step 2: Deploy API to Render**

### **Create Render Account**

1. **Go to Render**: [render.com](https://render.com)
2. **Sign Up with GitHub**: Connect your GitHub account
3. **Authorize Render**: Give access to your repositories

### **Create Web Service**

1. **New Web Service**: Click "New +" → "Web Service"
2. **Connect Repository**: Select `family-website`
3. **Configure Service**:

```yaml
Name: family-website-api
Environment: Node
Region: Oregon (US West) or closest to you
Branch: feature/improvements
Root Directory: apps/api
Build Command: npm install && npm run build
Start Command: npm start
```

### **Environment Variables**

Add these in Render dashboard:

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://family-app-user:YOUR_PASSWORD@family-website-cluster.xxxxx.mongodb.net/family-portal?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
REFRESH_TOKEN_SECRET=another-super-secret-refresh-key-also-32-chars-long
FRONTEND_URL=https://family-website-gig9gzci5-uttams-projects-f81f6e6d.vercel.app
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
GEMINI_API_KEY=your-gemini-api-key
GROK_API_KEY=your-grok-api-key
```

**Generate Secure Secrets**:

```bash
# Generate JWT secrets (run these locally)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🎯 **Step 3: Deploy and Test**

### **Deploy Process**

1. **Click Deploy**: Render will automatically build and deploy
2. **Monitor Logs**: Watch the deployment progress
3. **Wait for Success**: First deployment takes 2-3 minutes

### **Test API Endpoints**

Once deployed, test these URLs:

```bash
# Health check
https://your-api-name.onrender.com/api/health-check

# Test endpoint
https://your-api-name.onrender.com/api/test

# CSRF token (for frontend)
https://your-api-name.onrender.com/api/auth/csrf-token
```

---

## 🎯 **Step 4: Connect Frontend to Backend**

### **Update Vercel Environment Variable**

1. **Go to Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Select Project**: `family-website`
3. **Settings** → **Environment Variables**
4. **Add Variable**:
   ```
   Name: VITE_API_BASE_URL
   Value: https://your-api-name.onrender.com
   ```
5. **Redeploy Frontend**: Trigger new deployment

---

## 🎯 **Step 5: Verification**

### **Backend Verification**

- ✅ API responds to health checks
- ✅ MongoDB connection established
- ✅ Environment variables loaded
- ✅ CORS configured for frontend

### **Frontend Verification**

- ✅ API calls reach backend
- ✅ Authentication flow works
- ✅ No CORS errors in browser console

---

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Build Fails**:

   ```bash
   # Check if TypeScript compiles
   cd apps/api && npm run build
   ```

2. **MongoDB Connection Fails**:
   - Verify connection string format
   - Check database user permissions
   - Ensure IP whitelist includes 0.0.0.0/0

3. **CORS Errors**:
   - Verify FRONTEND_URL matches exact Vercel URL
   - Check browser network tab for preflight requests

4. **Environment Variables Missing**:
   - Double-check all required variables in Render
   - Restart service after adding variables

---

## 💰 **Cost Breakdown (FREE!)**

### **MongoDB Atlas**

- ✅ **M0 Sandbox**: FREE forever
- ✅ **512MB storage**: FREE
- ✅ **Shared RAM**: FREE
- ✅ **No credit card required**

### **Render**

- ✅ **750 hours/month**: FREE (enough for 24/7)
- ✅ **512MB RAM**: FREE
- ✅ **Custom domains**: FREE
- ✅ **SSL certificates**: FREE
- ⚠️ **Sleeps after 15min inactivity** (wakes up in ~30 seconds)

### **Total Monthly Cost: $0.00** 🎉

---

## 🚀 **Ready to Deploy?**

**I can help you with each step:**

1. **MongoDB Atlas setup** - Create database and get connection string
2. **Render deployment** - Configure and deploy the API
3. **Environment variables** - Set up all required variables
4. **Frontend connection** - Update Vercel to use new API
5. **Testing** - Verify everything works end-to-end

**Which step would you like to start with?**

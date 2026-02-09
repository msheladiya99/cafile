# 🚀 CA Office Portal - Deployment Guide

This guide will help you deploy your CA Office Portal application to production.

## 📋 Prerequisites

- GitHub account (✅ Already done)
- MongoDB Atlas account (✅ Already set up)
- Email configured (✅ Already set up)
- Google Drive configured (✅ Already set up)

---

## 🌐 Deployment Options

### **Option 1: Render (Recommended - Free Tier)**
- ✅ Free tier available
- ✅ Easy to use
- ✅ Automatic deployments from GitHub
- ✅ Built-in SSL certificates

### **Option 2: Railway**
- ✅ Free $5 credit per month
- ✅ Simple deployment
- ✅ Good for full-stack apps

### **Option 3: Vercel (Frontend) + Render (Backend)**
- ✅ Best performance
- ✅ Separate frontend and backend

---

## 🎯 Recommended: Deploy on Render

### **Step 1: Deploy Backend (Server)**

1. **Go to Render**: https://render.com
2. **Sign up** with your GitHub account
3. **Click "New +"** → **"Web Service"**
4. **Connect your repository**: `msheladiya99/cafile`
5. **Configure the service**:

   ```
   Name: ca-office-backend
   Region: Singapore (or closest to you)
   Branch: main
   Root Directory: server
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   Instance Type: Free
   ```

6. **Add Environment Variables** (click "Advanced" → "Add Environment Variable"):

   ```
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=<your-mongodb-atlas-connection-string>
   JWT_SECRET=<generate-a-strong-random-secret>
   JWT_EXPIRES_IN=7d
   CLIENT_URL=<will-add-after-frontend-deployment>
   
   # Email Configuration
   EMAIL_USER=<your-gmail>
   EMAIL_PASSWORD=<your-gmail-app-password>
   EMAIL_FROM_NAME=CA Office Portal
   
   # Google Drive Configuration
   GOOGLE_DRIVE_CLIENT_EMAIL=<your-service-account-email>
   GOOGLE_DRIVE_PRIVATE_KEY=<your-private-key-with-\n>
   GOOGLE_DRIVE_CLIENT_ID=<your-client-id>
   GOOGLE_DRIVE_CLIENT_SECRET=<your-client-secret>
   GOOGLE_DRIVE_REFRESH_TOKEN=<your-refresh-token>
   GOOGLE_DRIVE_ROOT_FOLDER_ID=<your-folder-id>
   ```

7. **Click "Create Web Service"**
8. **Wait for deployment** (5-10 minutes)
9. **Copy your backend URL**: `https://ca-office-backend.onrender.com`

---

### **Step 2: Deploy Frontend (Client)**

#### **Option A: Deploy on Render**

1. **Click "New +"** → **"Static Site"**
2. **Connect your repository**: `msheladiya99/cafile`
3. **Configure**:

   ```
   Name: ca-office-frontend
   Branch: main
   Root Directory: client
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

4. **Add Environment Variable**:

   ```
   VITE_API_URL=https://ca-office-backend.onrender.com/api
   ```

5. **Click "Create Static Site"**
6. **Wait for deployment**
7. **Your app will be live at**: `https://ca-office-frontend.onrender.com`

#### **Option B: Deploy on Vercel (Better for React)**

1. **Go to**: https://vercel.com
2. **Sign up** with GitHub
3. **Click "Add New"** → **"Project"**
4. **Import** `msheladiya99/cafile`
5. **Configure**:

   ```
   Framework Preset: Vite
   Root Directory: client
   Build Command: npm run build
   Output Directory: dist
   ```

6. **Add Environment Variable**:

   ```
   VITE_API_URL=https://ca-office-backend.onrender.com/api
   ```

7. **Click "Deploy"**
8. **Your app will be live at**: `https://ca-office-frontend.vercel.app`

---

### **Step 3: Update Backend with Frontend URL**

1. Go back to **Render Dashboard** → **ca-office-backend**
2. Click **"Environment"**
3. Update `CLIENT_URL` to your frontend URL:
   - If using Render: `https://ca-office-frontend.onrender.com`
   - If using Vercel: `https://ca-office-frontend.vercel.app`
4. **Save Changes** (this will redeploy)

---

### **Step 4: Update MongoDB Atlas**

1. Go to **MongoDB Atlas**: https://cloud.mongodb.com
2. Click **"Network Access"**
3. Click **"Add IP Address"**
4. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
5. Click **"Confirm"**

---

### **Step 5: Create Admin User**

After deployment, you need to create an admin user:

1. **Option A: Use Render Shell**
   - Go to Render Dashboard → ca-office-backend
   - Click "Shell" tab
   - Run: `npm run seed`

2. **Option B: Use MongoDB Compass**
   - Connect to your MongoDB Atlas
   - Create a user manually in the `users` collection

---

## 🔒 Security Checklist

- ✅ Never commit `.env` files
- ✅ Use strong JWT_SECRET (generate with: `openssl rand -base64 32`)
- ✅ Enable MongoDB IP whitelist
- ✅ Use environment variables for all secrets
- ✅ Enable HTTPS (automatic on Render/Vercel)

---

## 📱 Custom Domain (Optional)

### **For Render:**
1. Go to Settings → Custom Domain
2. Add your domain
3. Update DNS records as instructed

### **For Vercel:**
1. Go to Settings → Domains
2. Add your domain
3. Update DNS records

---

## 🐛 Troubleshooting

### **Backend won't start:**
- Check environment variables are set correctly
- Check MongoDB connection string
- View logs in Render Dashboard

### **Frontend can't connect to backend:**
- Verify `VITE_API_URL` is correct
- Check CORS settings in backend
- Verify `CLIENT_URL` in backend matches frontend URL

### **Database connection fails:**
- Check MongoDB Atlas IP whitelist
- Verify connection string
- Check MongoDB Atlas cluster is running

---

## 📊 Monitoring

### **Render Dashboard:**
- View logs
- Monitor CPU/Memory usage
- Check deployment status

### **MongoDB Atlas:**
- Monitor database performance
- Check connection metrics
- View query performance

---

## 🔄 Automatic Deployments

Both Render and Vercel support automatic deployments:

1. Push code to GitHub
2. Automatic deployment triggers
3. New version goes live

To enable:
- **Render**: Enabled by default
- **Vercel**: Enabled by default

---

## 💰 Cost Estimates

### **Free Tier (Recommended for Testing):**
- Render: Free (with limitations)
- Vercel: Free (generous limits)
- MongoDB Atlas: Free (512MB)
- **Total: $0/month**

### **Production Tier:**
- Render Pro: $7/month per service
- Vercel Pro: $20/month
- MongoDB Atlas: $9/month (2GB)
- **Total: ~$43/month**

---

## 🎉 Quick Deploy Commands

If you want to test locally before deploying:

```bash
# Build and test backend
cd server
npm install
npm run build
npm start

# Build and test frontend
cd client
npm install
npm run build
npm run preview
```

---

## 📞 Support

If you encounter issues:
1. Check the logs in Render/Vercel dashboard
2. Verify all environment variables
3. Test MongoDB connection
4. Check GitHub repository is up to date

---

## 🚀 Alternative: Deploy Everything on Railway

Railway is simpler for full-stack apps:

1. Go to: https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `msheladiya99/cafile`
5. Railway will auto-detect both client and server
6. Add environment variables
7. Deploy!

**Railway Advantages:**
- One-click deployment
- Automatic monorepo detection
- Built-in database options
- Simple pricing

---

## ✅ Post-Deployment Checklist

- [ ] Backend is running and accessible
- [ ] Frontend is running and accessible
- [ ] Can login to the application
- [ ] File uploads work
- [ ] Email notifications work
- [ ] Google Drive integration works
- [ ] MongoDB connection is stable
- [ ] SSL certificates are active
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring is set up

---

**Your app will be live at:**
- **Frontend**: `https://your-frontend-url.com`
- **Backend**: `https://your-backend-url.com`

**Default Admin Credentials** (after running seed):
- Email: admin@example.com
- Password: admin123

**⚠️ Remember to change the admin password after first login!**

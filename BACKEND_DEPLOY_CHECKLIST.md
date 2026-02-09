# ✅ Backend Deployment Checklist

## 🎯 Quick Start - Follow These Steps

### ☐ Step 1: Go to Render
- Open browser: https://render.com
- Click "Get Started for Free"
- Sign up with GitHub

### ☐ Step 2: Create Web Service
- Click "New +" button (top right)
- Select "Web Service"
- Connect repository: `msheladiya99/cafile`

### ☐ Step 3: Configure Service

**Basic Settings:**
```
Name: ca-office-backend
Region: Singapore (or closest to you)
Branch: main
Root Directory: server          ⚠️ IMPORTANT!
Runtime: Node
```

**Build Settings:**
```
Build Command: npm install && npm run build
Start Command: npm start
Instance Type: Free
```

### ☐ Step 4: Add Environment Variables

Click "Advanced" → "Add Environment Variable"

**Copy these exactly from your server/.env file:**

```
PORT = 5000
NODE_ENV = production
MONGODB_URI = <your MongoDB connection string>
JWT_SECRET = <your JWT secret>
JWT_EXPIRES_IN = 7d
CLIENT_URL = http://localhost:5173
UPLOAD_DIR = uploads

EMAIL_USER = <your email>
EMAIL_PASSWORD = <your email app password>
EMAIL_FROM_NAME = CA Office Portal

GOOGLE_DRIVE_CLIENT_EMAIL = <your service account email>
GOOGLE_DRIVE_PRIVATE_KEY = <your private key with \n>
GOOGLE_DRIVE_CLIENT_ID = <your client ID>
GOOGLE_DRIVE_CLIENT_SECRET = <your client secret>
GOOGLE_DRIVE_REFRESH_TOKEN = <your refresh token>
GOOGLE_DRIVE_ROOT_FOLDER_ID = <your folder ID>
```

### ☐ Step 5: Deploy
- Click "Create Web Service"
- Wait 5-10 minutes for deployment
- Watch the logs

### ☐ Step 6: Copy Backend URL
- Once deployed, copy the URL
- Example: `https://ca-office-backend.onrender.com`
- Save this URL - you need it for frontend!

### ☐ Step 7: Test Backend
- Open: `https://your-backend-url.onrender.com`
- Should see a response (not an error)

---

## 🎉 Done!

Your backend is now live on the internet!

**Next:** Deploy frontend and update CLIENT_URL

**Need detailed help?** Read `RENDER_BACKEND_DEPLOY.md`

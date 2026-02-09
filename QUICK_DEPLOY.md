# 🚀 Quick Deploy - Render (5 Minutes)

## Backend Deployment

1. **Go to**: https://render.com/signup
2. **Sign up** with GitHub
3. **New Web Service** → Connect `msheladiya99/cafile`
4. **Settings**:
   - Root Directory: `server`
   - Build: `npm install && npm run build`
   - Start: `npm start`
5. **Add Environment Variables** (copy from your `.env` file)
6. **Deploy** → Copy backend URL

## Frontend Deployment

1. **New Static Site** → Connect `msheladiya99/cafile`
2. **Settings**:
   - Root Directory: `client`
   - Build: `npm install && npm run build`
   - Publish: `dist`
3. **Environment Variable**:
   ```
   VITE_API_URL=<your-backend-url>/api
   ```
4. **Deploy** → Your app is live!

## Update Backend

1. Go to backend service
2. Update `CLIENT_URL` to your frontend URL
3. Save (auto-redeploys)

## ✅ Done!

Your app is now live and accessible worldwide!

**Note**: Free tier may sleep after inactivity. Upgrade to paid tier for 24/7 uptime.

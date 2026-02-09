# 🚀 Deployment Guide

## Prerequisites

- MongoDB Atlas account (free tier available)
- Render/Railway account (for backend)
- Netlify/Vercel account (for frontend)

## Step 1: Setup MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist IP addresses (0.0.0.0/0 for all IPs)
5. Get your connection string

Example connection string:
```
mongodb+srv://username:password@cluster.mongodb.net/ca-office?retryWrites=true&w=majority
```

## Step 2: Deploy Backend (Render)

### 2.1 Prepare Backend

Update `server/package.json` to ensure it has:
```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc"
  }
}
```

### 2.2 Deploy to Render

1. Go to [Render](https://render.com)
2. Create new Web Service
3. Connect your GitHub repository
4. Configure:
   - **Name:** ca-office-backend
   - **Environment:** Node
   - **Build Command:** `cd server && npm install && npm run build`
   - **Start Command:** `cd server && npm start`
   - **Root Directory:** Leave empty

5. Add Environment Variables:
   ```
   PORT=5000
   MONGODB_URI=<your-mongodb-atlas-uri>
   JWT_SECRET=<generate-random-secret>
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   UPLOAD_DIR=uploads
   CLIENT_URL=<your-frontend-url>
   GOOGLE_DRIVE_CLIENT_ID=<your-client-id>
   GOOGLE_DRIVE_CLIENT_SECRET=<your-client-secret>
   GOOGLE_DRIVE_REFRESH_TOKEN=<your-refresh-token>
   GOOGLE_DRIVE_ROOT_FOLDER_ID=<your-folder-id>
   ```

6. Deploy!

### 2.3 Create Admin User

After deployment, run seed script:
```bash
# SSH into your Render instance or use Render shell
npm run seed
```

## Step 3: Deploy Frontend (Netlify)

### 3.1 Prepare Frontend

Update `client/.env.production`:
```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

### 3.2 Deploy to Netlify

1. Go to [Netlify](https://www.netlify.com)
2. Create new site from Git
3. Configure:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `client/dist`

4. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

5. Deploy!

### 3.3 Configure Redirects

Create `client/public/_redirects`:
```
/*    /index.html   200
```

This ensures React Router works correctly.

## Step 4: Alternative - Deploy to Vercel

### Frontend on Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your repository
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

4. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

## Step 5: Alternative Backend Hosts

### Railway

1. Go to [Railway](https://railway.app)
2. Create new project
3. Deploy from GitHub
4. Add environment variables
5. Railway will auto-detect Node.js

### DigitalOcean App Platform

1. Create new app
2. Connect repository
3. Configure build settings
4. Add environment variables
5. Deploy

### AWS EC2 (Advanced)

1. Launch EC2 instance
2. Install Node.js and MongoDB
3. Clone repository
4. Configure nginx as reverse proxy
5. Set up SSL with Let's Encrypt
6. Configure PM2 for process management

## Step 6: Google Drive Configuration

Since your application uses Google Drive for file storage, you must configure the following environment variables in your backend deployment:

### Required Variables

1. **Service Account Method** (if using a service account):
   ```
   GOOGLE_DRIVE_CLIENT_EMAIL=<your-service-account-email>
   GOOGLE_DRIVE_PRIVATE_KEY=<your-private-key-with-newlines>
   ```

2. **OAuth2 Method** (Recommended for Personal Accounts):
   ```
   GOOGLE_DRIVE_CLIENT_ID=<your-client-id>
   GOOGLE_DRIVE_CLIENT_SECRET=<your-client-secret>
   GOOGLE_DRIVE_REFRESH_TOKEN=<your-refresh-token>
   ```

3. **Storage Location:**
   ```
   GOOGLE_DRIVE_ROOT_FOLDER_ID=<your-root-folder-id>
   ```

### Important Note on Private Keys
When adding `GOOGLE_DRIVE_PRIVATE_KEY` to Render/Railway variables, ensure you copy the entire key including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` parts. If the platform supports multiline values, paste it directly. If not, use `\n` for newlines.

## Step 7: SSL/HTTPS

### Netlify/Vercel
- Automatic SSL certificates
- No configuration needed

### Render
- Automatic SSL certificates
- Custom domain supported

### Custom Server
1. Use Let's Encrypt
2. Install Certbot
3. Configure nginx/Apache
4. Auto-renewal setup

## Step 8: Custom Domain

### Frontend (Netlify/Vercel)
1. Go to domain settings
2. Add custom domain
3. Update DNS records
4. Wait for propagation

### Backend (Render)
1. Go to settings
2. Add custom domain
3. Update DNS CNAME record
4. SSL auto-configured

## Step 9: Post-Deployment Checklist

- ✅ Backend is accessible
- ✅ Frontend loads correctly
- ✅ Login works
- ✅ File upload works
- ✅ File download works
- ✅ HTTPS enabled
- ✅ CORS configured correctly
- ✅ Environment variables set
- ✅ Admin user created
- ✅ Database connected

## Step 10: Monitoring & Maintenance

### Logging
- Use Render/Railway built-in logs
- Consider Logtail or Papertrail
- Monitor error rates

### Backups
- MongoDB Atlas automatic backups
- Export database regularly
- Backup uploaded files

### Updates
```bash
# Update dependencies
npm update

# Security updates
npm audit fix
```

## 🔒 Security Checklist

- ✅ Change default admin password
- ✅ Use strong JWT secret
- ✅ Enable HTTPS only
- ✅ Configure CORS properly
- ✅ Set secure headers (Helmet)
- ✅ Validate all inputs
- ✅ Rate limiting (optional)
- ✅ Regular security audits

## 📊 Performance Optimization

1. **Frontend**
   - Enable gzip compression
   - Optimize images
   - Code splitting
   - Lazy loading

2. **Backend**
   - Database indexing
   - Caching (Redis)
   - CDN for static files
   - Load balancing

## 🆘 Troubleshooting

### CORS Errors
- Check CLIENT_URL in backend .env
- Verify CORS configuration
- Check browser console

### File Upload Fails
- Check file size limits
- Verify upload directory permissions
- Check server disk space

### Database Connection Issues
- Verify MongoDB URI
- Check IP whitelist
- Ensure database user exists

### 404 on Refresh
- Add `_redirects` file for Netlify
- Configure `vercel.json` for Vercel
- Check React Router configuration

---

## 🎉 Congratulations!

Your CA Office Portal is now live and ready for production use!

**Support:** For issues, check logs and error messages first.

**Updates:** Keep dependencies updated for security patches.

**Scaling:** Consider upgrading hosting plans as usage grows.

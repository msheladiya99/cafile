---
description: How to run the CA Office Portal application
---

# Running the CA Office Portal

Follow these steps to start the application:

## Prerequisites Check
- ✅ Node.js installed (v18+)
- ✅ MongoDB installed and running
- ✅ Dependencies installed

## Step 1: Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows - if not running as service
mongod
```

## Step 2: Start Backend Server

// turbo
```bash
cd d:/itr-app/server
npm run dev
```

Wait for the message: `✅ MongoDB connected successfully`

## Step 3: Create Admin User (First Time Only)

If this is your first time running the app:

```bash
cd d:/itr-app/server
npm run seed
```

This creates the admin account:
- Username: `admin`
- Password: `admin123`

## Step 4: Start Frontend

In a new terminal:

// turbo
```bash
cd d:/itr-app/client
npm run dev
```

## Step 5: Access Application

Open your browser and navigate to:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## Default Login

**Admin:**
- Username: `admin`
- Password: `admin123`

## Common Issues

### MongoDB Connection Failed
- Ensure MongoDB is running
- Check connection string in `server/.env`

### Port Already in Use
- Backend: Change PORT in `server/.env`
- Frontend: Vite will suggest alternative port

### Dependencies Missing
```bash
# Reinstall backend dependencies
cd d:/itr-app/server
npm install

# Reinstall frontend dependencies
cd d:/itr-app/client
npm install
```

## Production Build

### Backend
```bash
cd d:/itr-app/server
npm run build
npm start
```

### Frontend
```bash
cd d:/itr-app/client
npm run build
npm run preview
```

---

**Ready to use! 🚀**

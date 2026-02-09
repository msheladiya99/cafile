# CA Office Portal - Admin Panel + Client Download Portal

> **📚 Documentation Links:**
> - [**📖 User Guide & Manual**](./APP_DOCUMENTATION.md) - Complete feature guide.
> - [**🚀 Deployment Guide**](./DEPLOYMENT.md) - production setup instructions.

A secure, full-stack web application for CA offices to manage clients and their documents.

## 🎯 Features

### Admin (CA) Features
- ✅ Create client accounts with auto-generated credentials
- ✅ Upload ITR, GST, and Accounting documents
- ✅ Manage files (edit names, delete)
- ✅ View all clients and their files
- ✅ Client-wise data organization

### Client Features
- ✅ Secure login with credentials provided by CA
- ✅ View all their documents
- ✅ Download files
- ✅ Filter by year and category
- ✅ Cannot upload or modify files

## 🧱 Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Material UI
- React Router
- Axios
- React Query

### Backend
- Node.js + Express
- TypeScript
- MongoDB (Mongoose)
- JWT Authentication
- Bcrypt for password hashing
- Multer for file uploads

## 📁 Project Structure

```
itr-app/
├── server/                 # Backend
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── models/        # Mongoose models
│   │   ├── middleware/    # Auth & upload middleware
│   │   ├── routes/        # API routes
│   │   ├── server.ts      # Main server file
│   │   └── seed.ts        # Admin seeder
│   ├── uploads/           # File storage
│   └── package.json
│
└── client/                # Frontend
    ├── src/
    │   ├── components/    # Reusable components
    │   ├── contexts/      # Auth context
    │   ├── layouts/       # Admin & Client layouts
    │   ├── pages/         # Page components
    │   ├── services/      # API services
    │   └── App.tsx
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository**
```bash
cd d:/itr-app
```

2. **Setup Backend**
```bash
cd server
npm install

# Configure environment variables
# Edit .env file with your MongoDB URI

# Create admin user
npm run seed

# Start backend server
npm run dev
```

The backend will run on `http://localhost:5000`

3. **Setup Frontend**
```bash
cd ../client
npm install

# Start frontend
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🔐 Default Admin Credentials

After running the seed script:
- **Username:** `admin`
- **Password:** `admin123`

⚠️ **Important:** Change the password after first login!

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Admin Routes (Protected)
- `POST /api/admin/create-client` - Create new client
- `GET /api/admin/clients` - Get all clients
- `GET /api/admin/clients/:id` - Get single client
- `POST /api/admin/upload-file` - Upload file
- `GET /api/admin/files/:clientId` - Get client files
- `PATCH /api/admin/files/:fileId` - Update file name
- `DELETE /api/admin/files/:fileId` - Delete file
- `GET /api/admin/clients/:clientId/years` - Get available years

### Client Routes (Protected)
- `GET /api/client/files` - Get own files
- `GET /api/client/years` - Get available years
- `GET /api/client/download/:fileId` - Download file
- `GET /api/client/stats` - Get file statistics

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control
- ✅ Client-wise data isolation
- ✅ File access validation
- ✅ Secure file downloads
- ✅ CORS protection
- ✅ Helmet security headers

## 🎨 UI Features

- Beautiful gradient designs
- Glassmorphism effects
- Smooth animations
- Responsive layout
- Material Design components
- Color-coded file categories
- Interactive hover effects

## 📦 File Upload

**Supported Formats:**
- PDF
- Excel (.xlsx, .xls)
- Word (.doc, .docx)

**Max File Size:** 10MB

## 🗄️ Database Schema

### Users Collection
```javascript
{
  username: String,
  passwordHash: String,
  role: "ADMIN" | "CLIENT",
  clientId: ObjectId (for clients only)
}
```

### Clients Collection
```javascript
{
  name: String,
  email: String,
  phone: String,
  createdAt: Date
}
```

### Files Collection
```javascript
{
  clientId: ObjectId,
  year: String,
  category: "ITR" | "GST" | "ACCOUNTING",
  fileName: String,
  originalFileName: String,
  filePath: String,
  fileSize: Number,
  uploadedBy: ObjectId,
  uploadedAt: Date
}
```

## 🔄 Workflow

### Admin Workflow
1. Login to admin panel
2. Create client account (credentials auto-generated)
3. Share credentials with client
4. Upload client documents
5. Manage files (edit/delete)

### Client Workflow
1. Login with provided credentials
2. View dashboard with file statistics
3. Filter files by year/category
4. Download required files

## 🚀 Deployment

### Backend
- Deploy to Render, AWS, or DigitalOcean
- Use MongoDB Atlas for database
- Set environment variables

### Frontend
- Deploy to Netlify or Vercel
- Update API URL in environment variables

## 📄 Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ca-office
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
NODE_ENV=development
UPLOAD_DIR=uploads
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## 🛠️ Development Scripts

### Backend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run seed     # Create admin user
```

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 📞 Support

For issues or questions, please contact your development team.

## 📜 License

Private - CA Office Use Only

---

**Built with ❤️ for CA Offices**

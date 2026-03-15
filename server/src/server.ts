import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { connectDB } from './config/database'; // database.ts applies the plugin immediately
import { tenantMiddleware } from './middleware/tenant';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import clientRoutes from './routes/client';
import reminderRoutes from './routes/reminders';
import billingRoutes from './routes/billing';
import filesRoutes from './routes/files';
import staffRoutes from './routes/staff';
import analyticsRoutes from './routes/analytics';
import profileRoutes from './routes/profile';
import settingsRoutes from './routes/settings';
import taskRoutes from './routes/tasks';
import firmRoutes from './routes/firm';
import attendanceRoutes from './routes/attendance';
import superAdminRoutes from './routes/super-admin';
import taskMasterRoutes from './routes/taskMaster';
import taskApplicabilityRoutes from './routes/taskApplicability';


// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

// Update CORS to allow any subdomain of the main site
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://mycafile.in',
    'https://www.mycafile.in',
    'https://cafile.vercel.app',
    process.env.CLIENT_URL,
    /(^|\.)mycafile\.in$/,
    /(^|\.)cacloud\.in$/,
    /\.vercel\.app$/
].filter(Boolean) as (string | RegExp)[];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.some(pattern => {
            if (pattern instanceof RegExp) {
                return pattern.test(origin);
            }
            return pattern === origin;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply Tenant Middleware to all /api routes except health and super-admin
app.use('/api', (req, res, next) => {
    if (req.path === '/health' || req.path.startsWith('/super-admin')) {
        return next();
    }
    tenantMiddleware(req, res, next);
});

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'CA Office API is running', version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/firm', firmRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/task-master', taskMasterRoutes);
app.use('/api/task-applicability', taskApplicabilityRoutes);


// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        // Start listening
        httpServer.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 API URL: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

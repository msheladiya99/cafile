import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { connectDB } from './config/database';
import { socketService } from './services/socketService';
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

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

        // Initialize Socket.io
        socketService.initialize(httpServer);

        // Start listening
        httpServer.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 API URL: http://localhost:${PORT}/api`);
            console.log(`🔌 WebSocket server ready`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

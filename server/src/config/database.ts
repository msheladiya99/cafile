import mongoose from 'mongoose';
import { tenantPlugin } from '../utils/tenantPlugin';

// Apply global tenant plugin for multi-tenant isolation BEFORE any connection or model loading
// This must happen before any mongoose.model() calls occur in the application.
mongoose.plugin(tenantPlugin);

export const connectDB = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ca-office';

        await mongoose.connect(mongoUri, {
            maxPoolSize: 10,           // Allow up to 10 concurrent DB connections
            serverSelectionTimeoutMS: 30000, // Wait longer for primary selection (common for Atlas/slow networks)
            socketTimeoutMS: 45000,    // Close sockets after 45s of inactivity
        });

        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        console.error('TIP: Check if your current IP Address is whitelisted in MongoDB Atlas.');
        process.exit(1);
    }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err);
});

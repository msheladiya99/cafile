import mongoose from 'mongoose';
import { tenantPlugin } from '../utils/tenantPlugin';

// Apply global tenant plugin for multi-tenant isolation BEFORE any connection or model loading
// This must happen before any mongoose.model() calls occur in the application.
mongoose.plugin(tenantPlugin);

export const connectDB = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ca-office';

        await mongoose.connect(mongoUri);

        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
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

import mongoose from 'mongoose';
import { tenantPlugin } from '../utils/tenantPlugin';

// Apply global tenant plugin for multi-tenant isolation BEFORE any connection or model loading
// This must happen before any mongoose.model() calls occur in the application.
mongoose.plugin(tenantPlugin);

export const connectDB = async (retryOffset = 0): Promise<void> => {
    const maxRetries = 5;
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ca-office';

        console.log(`🔌 Attempting MongoDB connection (Attempt ${retryOffset + 1}/${maxRetries})...`);
        await mongoose.connect(mongoUri, {
            maxPoolSize: 10,           
            serverSelectionTimeoutMS: 30000, 
            socketTimeoutMS: 45000,
            heartbeatFrequencyMS: 10000, // Check health every 10s
        });

        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error(`❌ MongoDB connection error (Attempt ${retryOffset + 1}):`, error);
        
        if (retryOffset < maxRetries - 1) {
            const delay = Math.min(1000 * Math.pow(2, retryOffset), 10000); // Exponential backoff
            console.log(`🕒 Retrying in ${delay / 1000}s...`);
            await new Promise(res => setTimeout(res, delay));
            return connectDB(retryOffset + 1);
        }

        console.error('CRITICAL: Max retry attempts reached. Check if your current IP Address is whitelisted in MongoDB Atlas.');
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

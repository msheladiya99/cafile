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

        // Rename 'System Super Admin' to 'Super Admin' in the users collection
        try {
            const db = mongoose.connection.db;
            if (db) {
                const result = await db.collection('users').updateMany(
                    { role: 'SUPER_ADMIN', name: 'System Super Admin' },
                    { $set: { name: 'Super Admin' } }
                );
                if (result.modifiedCount > 0) {
                    console.log(`[Migration] Updated ${result.modifiedCount} superadmin user name(s) to 'Super Admin'`);
                }

                // If no superadmins exist in the superadmins collection, seed one
                const count = await db.collection('superadmins').countDocuments();
                if (count === 0) {
                    const bcrypt = require('bcryptjs');
                    const passwordHash = await bcrypt.hash('superpassword123', 10);
                    await db.collection('superadmins').insertOne({
                        email: 'meetjbs@gmail.com',
                        passwordHash,
                        name: 'Super Admin',
                        role: 'SUPER_ADMIN',
                        mobile: '9999999999',
                        createdAt: new Date()
                    });
                    console.log('[Migration] Seeded default superadmin in superadmins collection');
                } else {
                    // Ensure the existing superadmin has a mobile number and name is updated
                    await db.collection('superadmins').updateOne(
                        { email: 'meetjbs@gmail.com' },
                        { $set: { mobile: '9999999999', name: 'Super Admin' } }
                    );
                }
            }
        } catch (err) {
            console.error('Error running name migration:', err);
        }
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

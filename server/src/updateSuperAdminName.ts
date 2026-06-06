import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Fix for dotenv not finding .env when running from root
dotenv.config({ path: path.join(__dirname, '../.env') });

const updateSuperAdminName = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        // Import the real User model
        const { User } = await import('./models/User');

        // Update name of Super Admin
        const result = await User.updateMany(
            { role: 'SUPER_ADMIN', name: 'System Super Admin' },
            { $set: { name: 'Super Admin' } }
        );

        console.log(`\n✅ Database update complete. Modified ${result.modifiedCount} records.`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

updateSuperAdminName();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Fix for dotenv not finding .env when running from root
dotenv.config({ path: path.join(__dirname, '../.env') });

const createSuperAdmin = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        // Import the real User model to ensure consistency
        const { User } = await import('./models/User');

        const username = 'superadmin';
        const password = 'superpassword123';

        // Check if exists
        const existing = await User.findOne({ username, role: 'SUPER_ADMIN' });
        if (existing) {
            console.log('⚠️ Super Admin already exists!');
            process.exit(0);
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const superAdmin = new User({
            username,
            passwordHash,
            role: 'SUPER_ADMIN',
            name: 'System Super Admin',
            email: 'meetjbs@gmail.com',
            status: true
        });

        await superAdmin.save();

        console.log('\n✅ Super Admin created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);
        console.log('Access: cacloud.in/login');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

createSuperAdmin();

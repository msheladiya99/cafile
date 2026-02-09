import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './models/User';
import { connectDB } from './config/database';

dotenv.config();

const resetAdmin = async () => {
    try {
        await connectDB();

        // 1. Try to find the existing admin user (based on previous logs, it's 'meet')
        // We look for ANY user with role 'ADMIN' first.
        const adminUser = await User.findOne({ role: 'ADMIN' });

        if (adminUser) {
            console.log(`Found existing admin user: ${adminUser.username}`);

            // Reset password to 'admin123'
            const passwordHash = await bcrypt.hash('admin123', 10);
            adminUser.passwordHash = passwordHash;
            await adminUser.save();

            console.log('✅ Admin password reset successfully!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`Username: ${adminUser.username}`);
            console.log('Password: admin123');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        } else {
            // No admin found, create one
            console.log('No admin user found. Creating new admin...');

            const passwordHash = await bcrypt.hash('admin123', 10);
            const newAdmin = new User({
                username: 'admin',
                passwordHash,
                role: 'ADMIN'
            });

            await newAdmin.save();

            console.log('✅ Admin user created successfully!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Username: admin');
            console.log('Password: admin123');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error resetting admin:', error);
        process.exit(1);
    }
};

resetAdmin();

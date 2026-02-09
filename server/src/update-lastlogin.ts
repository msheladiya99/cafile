import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { User } from './models/User';

dotenv.config();

async function updateLastLogin() {
    try {
        console.log('Connecting to database...');
        await connectDB();

        console.log('Updating lastLogin for all users...');

        // Set lastLogin to createdAt for all users who don't have it
        const result = await User.updateMany(
            { lastLogin: null },
            { $set: { lastLogin: new Date() } }
        );

        console.log(`✅ Updated ${result.modifiedCount} users`);
        console.log('Done! You can now see login times in Analytics.');

        process.exit(0);
    } catch (error) {
        console.error('Error updating users:', error);
        process.exit(1);
    }
}

updateLastLogin();

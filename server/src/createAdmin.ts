import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('✅ Connected to MongoDB');

        // Define User schema inline
        const userSchema = new mongoose.Schema({
            username: { type: String, required: true, unique: true },
            passwordHash: { type: String, required: true },
            role: { type: String, enum: ['ADMIN', 'CLIENT'], required: true },
            clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' }
        });

        const User = mongoose.models.User || mongoose.model('User', userSchema);

        // Check if admin exists
        const existingAdmin = await User.findOne({ role: 'ADMIN' });
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log('Username:', existingAdmin.username);
            console.log('\nYou can login with:');
            console.log('Username: admin');
            console.log('Password: admin123');
            await mongoose.connection.close();
            process.exit(0);
        }

        // Create admin
        const passwordHash = await bcrypt.hash('admin123', 10);
        const admin = new User({
            username: 'admin',
            passwordHash,
            role: 'ADMIN'
        });

        await admin.save();

        console.log('\n✅ Admin user created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🌐 Open http://localhost:5173 and login!');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

createAdmin();

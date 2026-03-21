import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const populateSuperAdmin = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error('MONGODB_URI is not defined');

        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        const { SuperAdmin } = await import('./models/SuperAdmin');

        const email = 'superadmin@mycafile.in';
        const password = 'superpassword123';

        const existing = await SuperAdmin.findOne({ email });
        if (existing) {
            console.log('⚠️ Super Admin already exists in separate collection!');
            process.exit(0);
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const admin = new SuperAdmin({
            email,
            passwordHash,
            name: 'Master Super Admin',
            role: 'SUPER_ADMIN'
        });

        await admin.save();
        console.log('\n✅ SuperAdmin Model populated!');
        console.log('Email:', email);
        console.log('Password:', password);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

populateSuperAdmin();

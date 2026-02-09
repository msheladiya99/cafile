const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
    try {
        console.log('🔍 Checking database connection...\n');
        console.log('MongoDB URI:', process.env.MONGODB_URI?.replace(/:[^:@]+@/, ':****@'));

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully!\n');

        // Check users collection
        const User = mongoose.model('User', new mongoose.Schema({
            username: String,
            passwordHash: String,
            role: String,
            clientId: mongoose.Schema.Types.ObjectId
        }));

        const users = await User.find({});
        console.log(`📊 Total users in database: ${users.length}\n`);

        const adminUser = await User.findOne({ role: 'ADMIN' });
        if (adminUser) {
            console.log('✅ Admin user EXISTS!');
            console.log('   Username:', adminUser.username);
            console.log('   Role:', adminUser.role);
            console.log('\n✨ You can login with:');
            console.log('   Username: admin');
            console.log('   Password: admin123');
        } else {
            console.log('❌ No admin user found!');
            console.log('\n📝 Creating admin user...');

            const bcrypt = require('bcryptjs');
            const passwordHash = await bcrypt.hash('admin123', 10);
            const admin = new User({
                username: 'admin',
                passwordHash,
                role: 'ADMIN'
            });
            await admin.save();

            console.log('✅ Admin user created successfully!');
            console.log('\n✨ Login credentials:');
            console.log('   Username: admin');
            console.log('   Password: admin123');
        }

        await mongoose.connection.close();
        console.log('\n🔒 Database connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkDatabase();

const mongoose = require('mongoose');
require('dotenv').config();

async function listAllData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Firm = mongoose.model('Firm', new mongoose.Schema({ firmName: String, subdomain: String }));
        const firms = await Firm.find();
        console.log('--- FIRMS ---');
        firms.forEach(f => console.log(`ID: ${f._id} | Name: ${f.firmName} | Subdomain: ${f.subdomain}`));
        
        const User = mongoose.model('User', new mongoose.Schema({ username: String, firmId: mongoose.Schema.Types.ObjectId, role: String }));
        const users = await User.find({ username: 'paresh@gmail.com' });
        console.log('\n--- USERS (paresh@gmail.com) ---');
        users.forEach(u => console.log(`ID: ${u._id} | Username: ${u.username} | Role: ${u.role} | FirmId: ${u.firmId}`));

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

listAllData();

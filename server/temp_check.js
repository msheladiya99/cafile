const mongoose = require('mongoose');

async function check() {
    await mongoose.connect('mongodb://127.0.0.1:27017/itr-app');
    const clients = mongoose.connection.collection('clients');
    const docs = await clients.find({ "profileImageUrl": { "$exists": true } }).toArray();
    console.log('Profile image URLs from DB:', docs.map(d => d.profileImageUrl));
    process.exit(0);
}

check().catch(console.error);

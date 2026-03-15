const mongoose = require('mongoose');
require('dotenv').config();

async function checkMigration() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const collections = ['users', 'clients', 'tasks', 'files', 'invoices', 'reminders'];
        
        for (const colName of collections) {
            try {
                const count = await mongoose.connection.db.collection(colName).countDocuments({ 
                    $or: [
                        { firmId: null }, 
                        { firmId: { $exists: false } }
                    ] 
                });
                console.log(`Collection ${colName}: ${count} records without firmId`);
            } catch (err) {
                console.log(`Collection ${colName}: Error - ${err.message}`);
            }
        }

        mongoose.connection.close();
    } catch (err) {
        console.error('Migration check error:', err);
    }
}

checkMigration();

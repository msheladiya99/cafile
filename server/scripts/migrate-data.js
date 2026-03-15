const mongoose = require('mongoose');
require('dotenv').config();

async function migrate(subdomain) {
    if (!subdomain) {
        console.error('Please provide a subdomain: node scripts/migrate-data.js <subdomain>');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Find the target firm
        const firm = await mongoose.connection.db.collection('firms').findOne({ subdomain });
        if (!firm) {
            console.error(`Firm with subdomain "${subdomain}" not found.`);
            process.exit(1);
        }
        const firmId = firm._id;
        console.log(`Migrating orphaned records to firm: ${firm.firmName} (${firmId})`);

        const collections = ['users', 'clients', 'tasks', 'files', 'invoices', 'reminders', 'clientgroups', 'itstatuses', 'attendances', 'services', 'settings'];
        
        for (const colName of collections) {
            try {
                const query = { 
                    $or: [
                        { firmId: null }, 
                        { firmId: { $exists: false } }
                    ] 
                };
                
                // For users, don't migrate SUPER_ADMIN
                if (colName === 'users') {
                    query.role = { $ne: 'SUPER_ADMIN' };
                }

                const result = await mongoose.connection.db.collection(colName).updateMany(query, { $set: { firmId } });
                console.log(`Collection ${colName}: Migrated ${result.modifiedCount} records`);
            } catch (err) {
                console.log(`Collection ${colName}: Error - ${err.message}`);
            }
        }

        console.log('Migration complete!');
        mongoose.connection.close();
    } catch (err) {
        console.error('Migration error:', err);
    }
}

const target = process.argv[2];
migrate(target);

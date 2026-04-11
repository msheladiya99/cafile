const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/itrapp';

mongoose.connect(uri).then(async () => {
    const result = await mongoose.connection.db.collection('creditledgers').updateMany(
        {},
        { $set: { monthlyLimit: -1, totalAllotted: -1, usedThisMonth: 0, planType: 'enterprise' } }
    );
    console.log('✅ Unlimited credits set. Updated', result.modifiedCount, 'ledger(s).');
    process.exit(0);
}).catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
});

const mongoose = require('mongoose');
require('dotenv').config();
const { User } = require('./dist/models/User');
const { FirmMaster } = require('./dist/models/FirmMaster');
const { Firm } = require('./dist/models/Firm');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const targetFirm = await Firm.findOne({ subdomain: 'lalit' }) || await Firm.findOne();
        if (!targetFirm) {
            console.log('No firms found to migrate to');
            await mongoose.disconnect();
            return;
        }
        console.log('Target Firm:', targetFirm.name, 'ID:', targetFirm._id);

        // Fix Admin users with missing firmId
        const userRes = await User.updateMany(
            { role: 'ADMIN', $or: [{ firmId: { $exists: false } }, { firmId: null }] },
            { $set: { firmId: targetFirm._id } }
        );
        console.log('Updated admin users:', userRes.modifiedCount);

        // Fix User names/emails if they are used for login correctly
        const meetUser = await User.findOne({ username: 'meet' });
        if (meetUser && !meetUser.firmId) {
            meetUser.firmId = targetFirm._id;
            await meetUser.save();
            console.log('Fixed user meet');
        }

        // Fix FirmMaster records with missing firmId
        const fmRes = await FirmMaster.updateMany(
            { $or: [{ firmId: { $exists: false } }, { firmId: null }] },
            { $set: { firmId: targetFirm._id } }
        );
        console.log('Updated FirmMaster records:', fmRes.modifiedCount);

        await mongoose.disconnect();
        console.log('Done');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();

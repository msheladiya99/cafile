const mongoose = require('mongoose');
require('dotenv').config();

async function checkMultiFirms() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const MultiFirm = mongoose.model('MultiFirm', new mongoose.Schema({}, { strict: false }));
        const firms = await MultiFirm.find().lean();
        console.log('--- MULTI FIRMS ---');
        firms.forEach(f => {
            console.log(`ID: ${f._id} | Name: ${f.firmName} | FirmId: ${f.firmId}`);
        });

        const Firm = mongoose.model('Firm', new mongoose.Schema({ firmName: String, subdomain: String }));
        const mainFirms = await Firm.find();
        console.log('\n--- MAIN FIRMS ---');
        mainFirms.forEach(f => console.log(`ID: ${f._id} | Name: ${f.firmName} | Subdomain: ${f.subdomain}`));

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

checkMultiFirms();

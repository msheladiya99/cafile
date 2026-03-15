const mongoose = require('mongoose');
require('dotenv').config();

async function listFirms() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Firm = mongoose.model('Firm', new mongoose.Schema({ firmName: String, subdomain: String }));
        const firms = await Firm.find();
        console.log('Available Firms:');
        firms.forEach(f => console.log(`- ${f.firmName} (${f.subdomain}): ${f._id}`));
        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

listFirms();

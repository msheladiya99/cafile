const mongoose = require('mongoose');

const uri = 'mongodb+srv://meetjbs:Meet123@itr.bgwoypp.mongodb.net/ca-office?retryWrites=true&w=majority&ssl=true&tlsAllowInvalidCertificates=true';

const ClientGroupSchema = new mongoose.Schema({
    firmId: mongoose.Schema.Types.ObjectId,
    groupName: String,
    groupOwnByFirm: mongoose.Schema.Types.ObjectId,
}, { strict: false });
const ClientGroup = mongoose.model('ClientGroup', ClientGroupSchema);

async function run() {
    await mongoose.connect(uri);
    try {
        const groups = await ClientGroup.find().lean();
        console.log('All Groups in DB:');
        console.log(JSON.stringify(groups, null, 2));
    } catch (err) {
        console.error('Error:', err);
    }
    await mongoose.connection.close();
}
run();

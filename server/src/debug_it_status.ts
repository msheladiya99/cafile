import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected');

        const ITStatusSchema = new mongoose.Schema({
            name: String,
            firmId: mongoose.Schema.Types.ObjectId,
            status: Boolean
        }, { strict: false });

        const ITStatus = mongoose.models.ITStatus || mongoose.model('ITStatus', ITStatusSchema);
        const Firm = mongoose.models.Firm || mongoose.model('Firm', new mongoose.Schema({}, { strict: false }));

        const firms = await Firm.find({ subdomain: 'paresh-co' });
        console.log('Firms with paresh-co:', firms.map((f: any) => ({ subdomain: f.subdomain, _id: f._id })));

        if (firms.length > 0) {
            const firmId = firms[0]._id;
            const statuses = await ITStatus.find({ firmId });
            console.log('Statuses for paresh-co:', statuses);
        }

        const allStatuses = await ITStatus.find({});
        console.log('All Statuses count:', allStatuses.length);
        if (allStatuses.length > 0) {
            console.log('Sample Status:', JSON.stringify(allStatuses[0], null, 2));
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
};

checkData();

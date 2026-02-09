
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Client } from './models/Client';

dotenv.config();

const resetClientFolders = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('✅ Connected to MongoDB');

        const email = 'meetjbs@gmail.com'; // The client email from your screenshot
        const client = await Client.findOne({ email });

        if (!client) {
            console.log('❌ Client not found!');
            return;
        }

        console.log(`Found client: ${client.name}`);
        console.log('Current Folder IDs:', {
            root: client.driveFolderId,
            itr: client.driveItrFolderId,
            gst: client.driveGstFolderId,
            acc: client.driveAccountingFolderId
        });

        // Clear folder IDs
        client.driveFolderId = undefined;
        client.driveItrFolderId = undefined;
        client.driveGstFolderId = undefined;
        client.driveAccountingFolderId = undefined;

        await client.save();
        console.log('✅ Cleared folder IDs. Next upload will try to create new folders.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

resetClientFolders();

const { google } = require('googleapis');
const fs = require('fs');

async function testThumbnail() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.DRIVE_CLIENT_EMAIL,
            private_key: process.env.DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    try {
        // Query to get any image file
        const res = await drive.files.list({
            q: "mimeType contains 'image/' and trashed=false",
            fields: 'files(id, name, thumbnailLink)',
            pageSize: 1
        });
        
        console.log('Thumbnail test:', res.data.files[0]);
    } catch (e) {
        console.error('Error:', e);
    }
}
function loadEnv() {
    require('dotenv').config({ path: 'd:\\itr-app\\server\\.env' });
    testThumbnail();
}
loadEnv();

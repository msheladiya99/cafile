const { google } = require('googleapis');
require('dotenv').config();

const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const CODE = '4/0ASc3gC0MHcCYqD6ClbW7SJRMhBGQNxM7VMKuLs3eBRq1HQmu5hLQSyNWhvE8LC75_hAEwA';

console.log('Client ID:', CLIENT_ID);
// Mask secret 
console.log('Client Secret:', CLIENT_SECRET ? '***' : 'MISSING');

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Error: GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET must be set in .env');
    process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

async function getTokens() {
    try {
        const { tokens } = await oauth2Client.getToken(CODE);
        console.log('\nSUCCESS! Here is your Refresh Token:');
        console.log('----------------------------------------');
        const fs = require('fs');
        fs.writeFileSync('refresh_token.txt', tokens.refresh_token);
        console.log('REFRESH TOKEN SAVED TO refresh_token.txt');
    } catch (error) {
        console.error('Error retrieving access token:', error.message);
        if (error.response) console.error(error.response.data);
    }
}

getTokens();

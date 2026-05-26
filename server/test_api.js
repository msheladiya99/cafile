const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const uri = 'mongodb+srv://meetjbs:Meet123@itr.bgwoypp.mongodb.net/ca-office?retryWrites=true&w=majority&ssl=true&tlsAllowInvalidCertificates=true';
const jwtSecret = '-office-secret-key-2026-change-in-production';

const UserSchema = new mongoose.Schema({
    username: String,
    role: String,
    firmId: mongoose.Schema.Types.ObjectId,
}, { strict: false });
const User = mongoose.model('User', UserSchema);

async function run() {
    await mongoose.connect(uri);
    console.log('Connected to DB');
    try {
        const user = await User.findOne({ role: 'ADMIN' }).lean();
        if (!user) {
            console.error('No ADMIN user found');
            await mongoose.connection.close();
            return;
        }
        console.log('Found Admin User:', user.username, 'FirmId:', user.firmId);

        // Sign JWT Token
        const token = jwt.sign(
            { id: user._id, role: user.role, firmId: user.firmId },
            jwtSecret,
            { expiresIn: '1h' }
        );
        console.log('Signed JWT Token successfully');

        // Make HTTP Request to Localhost Port 5000
        try {
            const response = await axios.get('http://localhost:5000/api/admin/client-groups', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('API Request Succeeded! Groups Count:', response.data.length);
            console.log('First Group Sample:', JSON.stringify(response.data[0], null, 2));
        } catch (apiErr) {
            console.error('API Request Failed! Status:', apiErr.response?.status);
            console.error('API Response Data:', apiErr.response?.data);
            console.error('API Error Message:', apiErr.message);
        }

    } catch (err) {
        console.error('Error:', err);
    }
    await mongoose.connection.close();
}
run();

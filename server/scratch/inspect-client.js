const mongoose = require('mongoose');

const uri = 'mongodb+srv://meetjbs:Meet123@itr.bgwoypp.mongodb.net/ca-office?retryWrites=true&w=majority&ssl=true&tlsAllowInvalidCertificates=true';

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to DB');
    const clients = await mongoose.connection.db.collection('clients').find({}).sort({ createdAt: -1 }).limit(20).toArray();
    clients.forEach(c => {
      console.log(`ID: ${c._id}, Name: ${c.name}, Email: ${c.email}`);
    });
    await mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

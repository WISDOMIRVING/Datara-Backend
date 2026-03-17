const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend folder
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkDb() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections Found:', collections.map(c => c.name));

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const userCount = await User.countDocuments();
        console.log('Total Users:', userCount);

        const users = await User.find({ role: 'ADMIN' });
        console.log('Admin Users Found:', users.map(u => u.email));

        process.exit(0);
    } catch (err) {
        console.error('DB Check Failed:', err);
        process.exit(1);
    }
}

checkDb();

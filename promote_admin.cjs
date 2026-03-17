const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function promoteFirstUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        const firstUser = await User.findOne().sort({ createdAt: 1 });
        if (firstUser) {
            console.log('Promoting user:', firstUser.email);
            firstUser.role = 'ADMIN';
            await firstUser.save();
            console.log('User promoted to ADMIN successfully');
        } else {
            console.log('No users found to promote');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

promoteFirstUser();

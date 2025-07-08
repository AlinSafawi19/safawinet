const mongoose = require('mongoose');
const User = require('./models/User');
const { config } = require('./config/config');

const checkUser = async () => {
    try {
        console.log('=== Checking Admin User State ===');
        
        // Connect to MongoDB
        await mongoose.connect(config.database.uri);
        console.log('📦 Connected to MongoDB');
        
        // Find the admin user
        const adminUser = await User.findOne({ username: 'alin' });
        
        if (adminUser) {
            console.log('✅ Admin user found:');
            console.log('- Username:', adminUser.username);
            console.log('- Email:', adminUser.email);
            console.log('- welcomeEmailSent:', adminUser.welcomeEmailSent);
            console.log('- Created at:', adminUser.createdAt);
            console.log('- Last login:', adminUser.lastLogin);
        } else {
            console.log('❌ Admin user not found');
        }
        
    } catch (error) {
        console.error('❌ Error checking user:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('📦 Disconnected from MongoDB');
    }
};

checkUser(); 
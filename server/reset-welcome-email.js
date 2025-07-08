const mongoose = require('mongoose');
const User = require('./models/User');
const { config } = require('./config/config');

const resetWelcomeEmail = async () => {
    try {
        console.log('=== Resetting Welcome Email Flag ===');
        
        // Connect to MongoDB
        await mongoose.connect(config.database.uri);
        console.log('📦 Connected to MongoDB');
        
        // Find and update the admin user
        const adminUser = await User.findOne({ username: 'alin' });
        
        if (adminUser) {
            adminUser.welcomeEmailSent = false;
            await adminUser.save();
            
            console.log('✅ Welcome email flag reset successfully!');
            console.log('- Username:', adminUser.username);
            console.log('- welcomeEmailSent:', adminUser.welcomeEmailSent);
            console.log('🎯 Now try logging in to receive the welcome email!');
        } else {
            console.log('❌ Admin user not found');
        }
        
    } catch (error) {
        console.error('❌ Error resetting welcome email flag:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('📦 Disconnected from MongoDB');
    }
};

resetWelcomeEmail(); 
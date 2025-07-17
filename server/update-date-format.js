const mongoose = require('mongoose');
const { config } = require('./config/config');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Update date format for all users
const updateDateFormat = async () => {
  try {
    console.log('🔄 Starting date format update...');
    
    // Get the User model
    const User = require('./models/User');
    
    // Find all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users in database`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const user of users) {
      // Check if user has userPreferences
      if (!user.userPreferences) {
        // Create userPreferences if it doesn't exist
        user.userPreferences = {
          timezone: 'Asia/Beirut',
          language: 'english',
          theme: 'light',
          dateFormat: 'MMM DD, YYYY h:mm a',
          autoLogoutTime: 30
        };
        await user.save();
        updatedCount++;
        console.log(`✅ Updated user ${user.username} (created userPreferences)`);
      } else if (user.userPreferences.dateFormat !== 'MMM DD, YYYY h:mm a') {
        // Update dateFormat if it's different
        user.userPreferences.dateFormat = 'MMM DD, YYYY h:mm a';
        await user.save();
        updatedCount++;
        console.log(`✅ Updated user ${user.username} (dateFormat: ${user.userPreferences.dateFormat} → MMM DD, YYYY h:mm a)`);
      } else {
        // Skip if already has correct format
        skippedCount++;
        console.log(`⏭️  Skipped user ${user.username} (already has correct format)`);
      }
    }
    
    console.log('\n📈 Update Summary:');
    console.log(`✅ Updated: ${updatedCount} users`);
    console.log(`⏭️  Skipped: ${skippedCount} users`);
    console.log(`📊 Total: ${users.length} users`);
    
    if (updatedCount > 0) {
      console.log('\n🎉 Date format update completed successfully!');
    } else {
      console.log('\nℹ️  No updates needed - all users already have the correct date format.');
    }
    
  } catch (error) {
    console.error('❌ Error updating date format:', error);
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await updateDateFormat();
  } catch (error) {
    console.error('❌ Script execution error:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
main(); 
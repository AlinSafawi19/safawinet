const mongoose = require('mongoose');
const { config } = require('./config/config');
const { seedDatabase } = require('./seed/seed');

async function clearAndSeed() {
    try {
        console.log('🗑️  Clearing database...');
        await mongoose.connect(config.database.uri);
        
        // Drop all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const collection of collections) {
            await mongoose.connection.db.dropCollection(collection.name);
            console.log(`✅ Dropped collection: ${collection.name}`);
        }
        
        console.log('✅ Database cleared successfully!');
        
        // Run the seed script
        console.log('🌱 Running seed script...');
        await seedDatabase();
        
        console.log('✅ Database seeded successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📦 Disconnected from MongoDB');
    }
}

clearAndSeed(); 
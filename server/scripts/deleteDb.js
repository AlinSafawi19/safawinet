#!/usr/bin/env node

const mongoose = require('mongoose');
const readline = require('readline');
const { config } = require('../config/config');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Console logging functions
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  danger: (msg) => console.log(`${colors.red}${colors.bold}🚨 ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.cyan}${colors.bold}${msg}${colors.reset}\n`)
};

// Safety checks
const safetyChecks = {
  isProduction: () => {
    const env = process.env.NODE_ENV || 'development';
    if (env === 'production') {
      log.danger('⚠️  WARNING: You are in PRODUCTION environment!');
      log.danger('This will permanently delete ALL data in the production database!');
      return true;
    }
    return false;
  },
  
  isLocalhost: () => {
    const uri = config.database.uri;
    if (!uri.includes('localhost') && !uri.includes('127.0.0.1')) {
      log.warning('⚠️  WARNING: Database URI does not appear to be localhost!');
      log.warning(`Database URI: ${uri}`);
      return false;
    }
    return true;
  },
  
  hasBackup: () => {
    log.info('Have you created a backup of your database? (y/N)');
    return new Promise((resolve) => {
      rl.question('', (answer) => {
        const hasBackup = answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
        if (!hasBackup) {
          log.warning('⚠️  No backup confirmed. Proceed with extreme caution!');
        }
        resolve(hasBackup);
      });
    });
  }
};

// Database connection
const connectDB = async () => {
  try {
    const mongoOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    // Add authentication in production
    if (process.env.NODE_ENV === 'production') {
      mongoOptions.auth = {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      };
      mongoOptions.ssl = true;
      mongoOptions.sslValidate = true;
    }

    await mongoose.connect(config.database.uri, mongoOptions);
    log.success('Connected to MongoDB successfully');
    return true;
  } catch (error) {
    log.error(`Failed to connect to MongoDB: ${error.message}`);
    return false;
  }
};

// Get database statistics
const getDatabaseStats = async () => {
  try {
    const db = mongoose.connection.db;
    const stats = await db.stats();
    
    log.info('Database Statistics:');
    log.info(`- Database Name: ${stats.dbName}`);
    log.info(`- Collections: ${stats.collections}`);
    log.info(`- Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    log.info(`- Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    log.info(`- Indexes: ${stats.indexes}`);
    log.info(`- Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
    
    return stats;
  } catch (error) {
    log.error(`Failed to get database stats: ${error.message}`);
    return null;
  }
};

// List collections
const listCollections = async () => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    log.info('Collections in database:');
    collections.forEach((collection, index) => {
      log.info(`${index + 1}. ${collection.name}`);
    });
    
    return collections;
  } catch (error) {
    log.error(`Failed to list collections: ${error.message}`);
    return [];
  }
};

// Confirm deletion
const confirmDeletion = (stats) => {
  return new Promise((resolve) => {
    log.danger('\n🚨 DATABASE DELETION CONFIRMATION 🚨');
    log.danger('This action will PERMANENTLY DELETE the entire database!');
    log.danger('This action CANNOT be undone!');
    
    if (stats) {
      log.warning(`Database: ${stats.dbName}`);
      log.warning(`Collections: ${stats.collections}`);
      log.warning(`Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    }
    
    log.warning('\nTo confirm deletion, type the database name exactly:');
    rl.question('', (answer) => {
      const dbName = config.database.uri.split('/').pop().split('?')[0];
      if (answer === dbName) {
        log.success('Database name confirmed correctly');
        resolve(true);
      } else {
        log.error(`Incorrect database name. Expected: ${dbName}`);
        resolve(false);
      }
    });
  });
};

// Delete database
const deleteDatabase = async () => {
  try {
    const db = mongoose.connection.db;
    log.info('Deleting database...');
    
    await db.dropDatabase();
    
    log.success('✅ Database deleted successfully!');
    return true;
  } catch (error) {
    log.error(`Failed to delete database: ${error.message}`);
    return false;
  }
};

// Main execution
const main = async () => {
  log.header('🗄️  SAFEWINET DATABASE DELETION SCRIPT');
  
  // Check environment
  const isProd = safetyChecks.isProduction();
  const isLocal = safetyChecks.isLocalhost();
  
  log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  log.info(`Database URI: ${config.database.uri}`);
  
  // Safety warnings
  if (isProd) {
    log.danger('🚨 PRODUCTION ENVIRONMENT DETECTED 🚨');
    log.danger('This script will delete ALL production data!');
    log.danger('Make sure you have proper backups before proceeding!');
  }
  
  if (!isLocal) {
    log.warning('⚠️  Non-localhost database detected');
    log.warning('Please ensure this is the correct database to delete');
  }
  
  // Ask for backup confirmation
  const hasBackup = await safetyChecks.hasBackup();
  
  // Connect to database
  log.info('Connecting to database...');
  const connected = await connectDB();
  if (!connected) {
    log.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }
  
  // Get database statistics
  log.info('Getting database statistics...');
  const stats = await getDatabaseStats();
  
  // List collections
  log.info('Listing collections...');
  await listCollections();
  
  // Final confirmation
  const confirmed = await confirmDeletion(stats);
  if (!confirmed) {
    log.error('Deletion cancelled by user');
    process.exit(0);
  }
  
  // Delete database
  const deleted = await deleteDatabase();
  if (!deleted) {
    log.error('Failed to delete database');
    process.exit(1);
  }
  
  // Close connection
  await mongoose.connection.close();
  log.success('Database connection closed');
  
  log.header('🎉 DATABASE DELETION COMPLETED');
  log.success('The database has been successfully deleted');
  log.info('You can now run the seed script to recreate the database if needed');
  
  rl.close();
  process.exit(0);
};

// Handle process termination
process.on('SIGINT', async () => {
  log.warning('\n⚠️  Process interrupted by user');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    log.info('Database connection closed');
  }
  rl.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log.warning('\n⚠️  Process terminated');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    log.info('Database connection closed');
  }
  rl.close();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch((error) => {
    log.error(`Script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  deleteDatabase,
  connectDB,
  getDatabaseStats,
  listCollections
}; 
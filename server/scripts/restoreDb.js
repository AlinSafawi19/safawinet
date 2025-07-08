#!/usr/bin/env node

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { config } = require('../config/config');
require('dotenv').config();

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

// Get database name from URI
const getDatabaseName = () => {
  const uri = config.database.uri;
  return uri.split('/').pop().split('?')[0];
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

// Check if backup file exists
const checkBackupFile = (backupPath) => {
  if (!fs.existsSync(backupPath)) {
    log.error(`Backup file not found: ${backupPath}`);
    return false;
  }
  
  const stats = fs.statSync(backupPath);
  if (stats.size === 0) {
    log.error('Backup file is empty');
    return false;
  }
  
  log.success(`Backup file found: ${backupPath}`);
  log.info(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  return true;
};

// Restore database using mongorestore
const restoreWithMongorestore = async (backupPath) => {
  return new Promise((resolve, reject) => {
    const dbName = getDatabaseName();
    const uri = config.database.uri;
    
    // Build mongorestore command
    let command = `mongorestore --db ${dbName} --drop ${backupPath}`;
    
    // Add authentication if needed
    if (process.env.NODE_ENV === 'production' && process.env.DB_USER && process.env.DB_PASSWORD) {
      command = `mongorestore --uri "${uri}" --drop ${backupPath}`;
    }
    
    log.info('Starting database restore with mongorestore...');
    log.info(`Command: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log.error(`mongorestore failed: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        log.warning(`mongorestore warnings: ${stderr}`);
      }
      
      log.success('Database restore completed successfully');
      resolve(stdout);
    });
  });
};

// Restore database using native MongoDB driver
const restoreWithNativeDriver = async (backupPath) => {
  try {
    const db = mongoose.connection.db;
    
    // Read backup file
    log.info('Reading backup file...');
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    // Drop existing database
    log.info('Dropping existing database...');
    await db.dropDatabase();
    
    // Restore collections
    log.info('Restoring collections...');
    const collections = Object.keys(backupData);
    
    for (const collectionName of collections) {
      log.info(`Restoring collection: ${collectionName}`);
      
      const documents = backupData[collectionName];
      if (documents && documents.length > 0) {
        await db.collection(collectionName).insertMany(documents);
        log.success(`Restored ${documents.length} documents to ${collectionName}`);
      } else {
        log.warning(`No documents to restore for collection: ${collectionName}`);
      }
    }
    
    log.success('Database restore completed successfully');
  } catch (error) {
    log.error(`Failed to restore database: ${error.message}`);
    throw error;
  }
};

// Check if mongorestore is available
const checkMongorestore = () => {
  return new Promise((resolve) => {
    exec('mongorestore --version', (error) => {
      resolve(!error);
    });
  });
};

// Get backup file from command line arguments
const getBackupFile = () => {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log.error('No backup file specified');
    log.info('Usage: npm run restore-db <backup-file>');
    log.info('Example: npm run restore-db backups/safawinet-mydb-2024-12-01.json');
    process.exit(1);
  }
  
  const backupFile = args[0];
  
  // If relative path, make it absolute
  if (!path.isAbsolute(backupFile)) {
    return path.join(__dirname, '..', backupFile);
  }
  
  return backupFile;
};

// Main execution
const main = async () => {
  log.header('🗄️  SAFEWINET DATABASE RESTORE SCRIPT');
  
  log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  log.info(`Database URI: ${config.database.uri}`);
  
  // Get backup file
  const backupFile = getBackupFile();
  
  // Check if backup file exists
  if (!checkBackupFile(backupFile)) {
    process.exit(1);
  }
  
  // Safety warning
  log.danger('🚨 WARNING: This will overwrite the existing database!');
  log.danger('All existing data will be lost and replaced with backup data.');
  
  // Connect to database
  log.info('Connecting to database...');
  const connected = await connectDB();
  if (!connected) {
    log.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }
  
  // Check if mongorestore is available
  const hasMongorestore = await checkMongorestore();
  
  try {
    if (hasMongorestore && backupFile.endsWith('.bson')) {
      log.info('mongorestore is available, using it for restore...');
      await restoreWithMongorestore(backupFile);
    } else {
      log.info('Using native MongoDB driver for restore...');
      await restoreWithNativeDriver(backupFile);
    }
    
    // Get database statistics after restore
    const db = mongoose.connection.db;
    const stats = await db.stats();
    
    log.header('🎉 RESTORE COMPLETED SUCCESSFULLY');
    log.success(`Database: ${stats.dbName}`);
    log.success(`Collections: ${stats.collections}`);
    log.success(`Data size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    log.success(`Storage size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    log.error(`Restore failed: ${error.message}`);
    process.exit(1);
  }
  
  // Close connection
  await mongoose.connection.close();
  log.success('Database connection closed');
  
  process.exit(0);
};

// Handle process termination
process.on('SIGINT', async () => {
  log.warning('\n⚠️  Process interrupted by user');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    log.info('Database connection closed');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log.warning('\n⚠️  Process terminated');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    log.info('Database connection closed');
  }
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
  connectDB,
  restoreWithNativeDriver,
  restoreWithMongorestore
};

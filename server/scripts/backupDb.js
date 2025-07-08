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

// Create backup directory
const createBackupDir = () => {
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    log.info(`Created backup directory: ${backupDir}`);
  }
  return backupDir;
};

// Generate backup filename
const generateBackupFilename = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dbName = getDatabaseName();
  return `safawinet-${dbName}-${timestamp}.json`;
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

// Export database using mongodump
const exportWithMongodump = async (backupPath) => {
  return new Promise((resolve, reject) => {
    const dbName = getDatabaseName();
    const uri = config.database.uri;
    
    // Build mongodump command
    let command = `mongodump --db ${dbName} --out ${backupPath}`;
    
    // Add authentication if needed
    if (process.env.NODE_ENV === 'production' && process.env.DB_USER && process.env.DB_PASSWORD) {
      command = `mongodump --uri "${uri}" --out ${backupPath}`;
    }
    
    log.info('Starting database export with mongodump...');
    log.info(`Command: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log.error(`mongodump failed: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        log.warning(`mongodump warnings: ${stderr}`);
      }
      
      log.success('Database export completed successfully');
      resolve(stdout);
    });
  });
};

// Export database using native MongoDB driver
const exportWithNativeDriver = async (backupPath) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const backup = {};
    
    log.info('Exporting collections...');
    
    for (const collection of collections) {
      const collectionName = collection.name;
      log.info(`Exporting collection: ${collectionName}`);
      
      const documents = await db.collection(collectionName).find({}).toArray();
      backup[collectionName] = documents;
      
      log.success(`Exported ${documents.length} documents from ${collectionName}`);
    }
    
    // Write backup to file
    const backupFile = path.join(backupPath, generateBackupFilename());
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    log.success(`Backup saved to: ${backupFile}`);
    return backupFile;
  } catch (error) {
    log.error(`Failed to export database: ${error.message}`);
    throw error;
  }
};

// Check if mongodump is available
const checkMongodump = () => {
  return new Promise((resolve) => {
    exec('mongodump --version', (error) => {
      resolve(!error);
    });
  });
};

// Main execution
const main = async () => {
  log.header('🗄️  SAFEWINET DATABASE BACKUP SCRIPT');
  
  log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  log.info(`Database URI: ${config.database.uri}`);
  
  // Connect to database
  log.info('Connecting to database...');
  const connected = await connectDB();
  if (!connected) {
    log.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }
  
  // Get database statistics
  const stats = await getDatabaseStats();
  if (!stats) {
    log.error('Failed to get database statistics. Exiting...');
    process.exit(1);
  }
  
  // Create backup directory
  const backupDir = createBackupDir();
  
  // Check if mongodump is available
  const hasMongodump = await checkMongodump();
  
  let backupFile;
  
  if (hasMongodump) {
    log.info('mongodump is available, using it for backup...');
    try {
      await exportWithMongodump(backupDir);
      backupFile = path.join(backupDir, `${getDatabaseName()}-${new Date().toISOString().split('T')[0]}`);
    } catch (error) {
      log.warning('mongodump failed, falling back to native export...');
      backupFile = await exportWithNativeDriver(backupDir);
    }
  } else {
    log.info('mongodump not available, using native MongoDB driver...');
    backupFile = await exportWithNativeDriver(backupDir);
  }
  
  // Get backup file size
  const stats2 = fs.statSync(backupFile);
  const fileSizeInMB = (stats2.size / 1024 / 1024).toFixed(2);
  
  log.header('🎉 BACKUP COMPLETED SUCCESSFULLY');
  log.success(`Backup file: ${backupFile}`);
  log.success(`Backup size: ${fileSizeInMB} MB`);
  log.success(`Database: ${stats.dbName}`);
  log.success(`Collections: ${stats.collections}`);
  log.success(`Data size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
  
  // Close connection
  await mongoose.connection.close();
  log.success('Database connection closed');
  
  log.info('\nTo restore this backup, use the restore script:');
  log.info('npm run restore-db <backup-file>');
  
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
  getDatabaseStats,
  exportWithNativeDriver,
  exportWithMongodump
}; 
# 🗄️ **SafawiNet Database Management Scripts**

This document provides comprehensive information about the database management scripts available in the SafawiNet project.

## 📋 **Available Scripts**

### **1. Database Check Script**
**Command**: `npm run check-db`  
**File**: `server/scripts/checkDb.js`  
**Purpose**: Check database connection and health

**Features:**
- ✅ Database connection test
- ✅ Connection status verification
- ✅ Database statistics display
- ✅ Health check with detailed information

**Usage:**
```bash
cd server
npm run check-db
```

**Output Example:**
```
🗄️  SAFEWINET DATABASE CHECK SCRIPT

Environment: development
Database URI: mongodb://localhost:27017/safawinet

✅ Connected to MongoDB successfully
✅ Database connection is healthy

Database Statistics:
- Database Name: safawinet
- Collections: 3
- Data Size: 2.45 MB
- Storage Size: 3.12 MB
- Indexes: 8
- Index Size: 0.85 MB

✅ Database check completed successfully
```

---

### **2. Database Backup Script**
**Command**: `npm run backup-db`  
**File**: `server/scripts/backupDb.js`  
**Purpose**: Create a complete backup of the database

**Features:**
- ✅ **Automatic backup directory creation**
- ✅ **Multiple backup methods** (mongodump + native driver)
- ✅ **Compressed backup files**
- ✅ **Timestamped backup names**
- ✅ **Backup statistics display**
- ✅ **Production environment support**

**Usage:**
```bash
cd server
npm run backup-db
```

**Backup Methods:**
1. **mongodump** (if available) - Binary format, faster, smaller
2. **Native MongoDB Driver** - JSON format, more portable

**Backup Location:**
```
server/backups/
├── safawinet-mydb-2024-12-01T10-30-45-123Z.json
├── safawinet-mydb-2024-12-01T14-22-10-456Z.json
└── ...
```

**Output Example:**
```
🗄️  SAFEWINET DATABASE BACKUP SCRIPT

Environment: development
Database URI: mongodb://localhost:27017/safawinet

✅ Connected to MongoDB successfully

Database Statistics:
- Database Name: safawinet
- Collections: 3
- Data Size: 2.45 MB
- Storage Size: 3.12 MB
- Indexes: 8
- Index Size: 0.85 MB

mongodump is available, using it for backup...
Starting database export with mongodump...
Command: mongodump --db safawinet --out server/backups
✅ Database export completed successfully

🎉 BACKUP COMPLETED SUCCESSFULLY
✅ Backup file: server/backups/safawinet
✅ Backup size: 1.23 MB
✅ Database: safawinet
✅ Collections: 3
✅ Data size: 2.45 MB
```

---

### **3. Database Restore Script**
**Command**: `npm run restore-db <backup-file>`  
**File**: `server/scripts/restoreDb.js`  
**Purpose**: Restore database from a backup file

**Features:**
- ✅ **Multiple restore methods** (mongorestore + native driver)
- ✅ **Backup file validation**
- ✅ **Safety warnings and confirmations**
- ✅ **Complete database replacement**
- ✅ **Restore statistics display**

**Usage:**
```bash
cd server
npm run restore-db backups/safawinet-mydb-2024-12-01.json
```

**Restore Methods:**
1. **mongorestore** (if available) - For binary backups
2. **Native MongoDB Driver** - For JSON backups

**Safety Features:**
- ⚠️ **Production environment warnings**
- ⚠️ **Backup file validation**
- ⚠️ **Database overwrite confirmation**
- ⚠️ **File size and integrity checks**

**Output Example:**
```
🗄️  SAFEWINET DATABASE RESTORE SCRIPT

Environment: development
Database URI: mongodb://localhost:27017/safawinet

✅ Backup file found: backups/safawinet-mydb-2024-12-01.json
ℹ️  File size: 1.23 MB

🚨 WARNING: This will overwrite the existing database!
🚨 All existing data will be lost and replaced with backup data.

✅ Connected to MongoDB successfully

Using native MongoDB driver for restore...
ℹ️  Reading backup file...
ℹ️  Dropping existing database...
ℹ️  Restoring collections...
ℹ️  Restoring collection: users
✅ Restored 15 documents to users
ℹ️  Restoring collection: auditlogs
✅ Restored 234 documents to auditlogs
ℹ️  Restoring collection: sessions
✅ Restored 8 documents to sessions
✅ Database restore completed successfully

🎉 RESTORE COMPLETED SUCCESSFULLY
✅ Database: safawinet
✅ Collections: 3
✅ Data size: 2.45 MB
✅ Storage size: 3.12 MB
```

---

### **4. Database Delete Script**
**Command**: `npm run delete-db`  
**File**: `server/scripts/deleteDb.js`  
**Purpose**: Safely delete the entire database

**Features:**
- ✅ **Multiple safety checks**
- ✅ **Production environment warnings**
- ✅ **Database statistics display**
- ✅ **Confirmation prompts**
- ✅ **Backup reminder**
- ✅ **Colored console output**

**Safety Checks:**
1. **Environment detection** - Warns if production
2. **Localhost verification** - Confirms local database
3. **Backup confirmation** - Asks for backup confirmation
4. **Database name confirmation** - Requires typing exact database name
5. **Statistics display** - Shows what will be deleted

**Usage:**
```bash
cd server
npm run delete-db
```

**Safety Prompts:**
```
🗄️  SAFEWINET DATABASE DELETION SCRIPT

Environment: development
Database URI: mongodb://localhost:27017/safawinet

ℹ️  Have you created a backup of your database? (y/N)
> n
⚠️  No backup confirmed. Proceed with extreme caution!

✅ Connected to MongoDB successfully

Database Statistics:
- Database Name: safawinet
- Collections: 3
- Data Size: 2.45 MB
- Storage Size: 3.12 MB
- Indexes: 8
- Index Size: 0.85 MB

Collections in database:
1. users
2. auditlogs
3. sessions

🚨 DATABASE DELETION CONFIRMATION 🚨
🚨 This action will PERMANENTLY DELETE the entire database!
🚨 This action CANNOT be undone!

⚠️  Database: safawinet
⚠️  Collections: 3
⚠️  Data Size: 2.45 MB

⚠️  To confirm deletion, type the database name exactly:
> safawinet
✅ Database name confirmed correctly

ℹ️  Deleting database...
✅ Database deleted successfully!
```

---

## 🔧 **Script Configuration**

### **Environment Variables**
All scripts use the same environment configuration as the main application:

```bash
# .env file
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/safawinet
DB_USER=your_username
DB_PASSWORD=your_password
```

### **Database Connection Options**
Scripts automatically handle different environments:

- **Development**: Simple connection
- **Production**: SSL + Authentication
- **Staging**: Production-like with debugging

---

## 🛡️ **Security Features**

### **Production Safety**
- ⚠️ **Production environment detection**
- ⚠️ **Multiple confirmation prompts**
- ⚠️ **Backup requirement reminders**
- ⚠️ **Database name verification**

### **Data Protection**
- 🔒 **Secure database connections**
- 🔒 **Authentication in production**
- 🔒 **SSL/TLS encryption**
- 🔒 **Connection timeout handling**

### **Error Handling**
- ❌ **Graceful error handling**
- ❌ **Detailed error messages**
- ❌ **Connection cleanup**
- ❌ **Process termination handling**

---

## 📊 **Usage Examples**

### **Complete Database Management Workflow**

```bash
# 1. Check database health
npm run check-db

# 2. Create backup before changes
npm run backup-db

# 3. Make changes to database
# ... your database modifications ...

# 4. If something goes wrong, restore from backup
npm run restore-db backups/safawinet-mydb-2024-12-01.json

# 5. If you need to start fresh, delete database
npm run delete-db

# 6. Recreate database with seed data
npm run seed
```

### **Automated Backup Schedule**

```bash
# Create daily backup (add to crontab)
0 2 * * * cd /path/to/safawinet/server && npm run backup-db

# Create weekly backup
0 3 * * 0 cd /path/to/safawinet/server && npm run backup-db
```

### **Development Workflow**

```bash
# Start fresh development environment
npm run delete-db
npm run seed
npm run dev

# Check database after seeding
npm run check-db
```

---

## 🚨 **Important Warnings**

### **Production Environment**
- ⚠️ **NEVER run delete-db in production without backup**
- ⚠️ **Always create backup before restore in production**
- ⚠️ **Verify backup file integrity before restore**
- ⚠️ **Test restore process in staging first**

### **Backup Management**
- 💾 **Keep multiple backup versions**
- 💾 **Store backups in secure location**
- 💾 **Test backup restoration regularly**
- 💾 **Monitor backup file sizes**

### **Data Loss Prevention**
- 🔒 **Always confirm database name before deletion**
- 🔒 **Create backup before any destructive operation**
- 🔒 **Use version control for database schemas**
- 🔒 **Document all database changes**

---

## 📞 **Troubleshooting**

### **Common Issues**

**1. Connection Failed**
```bash
# Check MongoDB service
sudo systemctl status mongod

# Check connection string
echo $MONGODB_URI
```

**2. Permission Denied**
```bash
# Check file permissions
ls -la scripts/

# Make scripts executable
chmod +x scripts/*.js
```

**3. Backup File Not Found**
```bash
# List available backups
ls -la backups/

# Check backup directory
find . -name "*.json" -o -name "*.bson"
```

**4. Restore Failed**
```bash
# Check backup file integrity
file backups/safawinet-mydb-2024-12-01.json

# Validate JSON format
node -e "console.log(JSON.parse(require('fs').readFileSync('backups/safawinet-mydb-2024-12-01.json')))"
```

---

## 📚 **Additional Resources**

- **MongoDB Documentation**: https://docs.mongodb.com/
- **Mongoose Documentation**: https://mongoosejs.com/
- **Node.js File System**: https://nodejs.org/api/fs.html
- **Database Security Best Practices**: [SECURITY_10_10.md](./SECURITY_10_10.md)

---

**These scripts provide comprehensive database management capabilities for SafaWinet, ensuring data safety and operational efficiency.** 

## ✅ **Remember Me Implementation**

### **1. Backend Implementation (Server-side)**

In `server/routes/auth.js`, the Remember Me functionality is fully implemented:

```javascript
// Enhanced login route with 2FA support
router.post('/login', enhancedRateLimit, sanitizeInput, validateInput({
    body: {
        identifier: { required: true, type: 'string', minLength: 3, maxLength: 100 },
        password: { required: true, type: 'string', minLength: 6, maxLength: 128 },
        rememberMe: { type: 'boolean' },  // ✅ Remember Me field
        twoFactorCode: { type: 'string', maxLength: 10 }
    }
}), async (req, res) => {
    try {
        const { identifier, password, rememberMe, twoFactorCode } = req.body;
        
        // ... authentication logic ...
        
        // ✅ Generate JWT token with appropriate expiration
        const tokenExpiry = rememberMe ? '7d' : '24h';  // 7 days vs 24 hours
        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                isAdmin: user.isAdmin,
                sessionId,
                twoFactorEnabled: user.twoFactorEnabled
            },
            securityConfig.jwt.secret,
            { 
                expiresIn: tokenExpiry,  // ✅ Dynamic expiration
                issuer: securityConfig.jwt.issuer,
                audience: securityConfig.jwt.audience,
                algorithm: securityConfig.jwt.algorithm
            }
        );

        // ✅ Set secure HTTP-only cookie with dynamic maxAge
        const cookieOptions = {
            httpOnly: securityConfig.cookie.httpOnly,
            secure: securityConfig.cookie.secure,
            sameSite: securityConfig.cookie.sameSite,
            maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // ✅ 7 days vs 24 hours
            path: securityConfig.cookie.path
        };

        res.cookie('authToken', token, cookieOptions);
```

### **2. How It Works**

**When Remember Me is checked:**
- ✅ **Token expiration**: 7 days (`'7d'`)
- ✅ **Cookie maxAge**: 7 days (7 * 24 * 60 * 60 * 1000 milliseconds)
- ✅ **Session persistence**: User stays logged in for 7 days

**When Remember Me is NOT checked:**
- ✅ **Token expiration**: 24 hours (`'24h'`)
- ✅ **Cookie maxAge**: 24 hours (24 * 60 * 60 * 1000 milliseconds)
- ✅ **Session expiration**: User logs out after 24 hours

### **3. Security Features**

The Remember Me implementation includes several security measures:

- ✅ **Secure HTTP-only cookies** - Prevents XSS attacks
- ✅ **SameSite cookie attribute** - Prevents CSRF attacks
- ✅ **Secure flag in production** - Ensures HTTPS-only cookies
- ✅ **Session tracking** - Monitors active sessions
- ✅ **Session limits** - Maximum 5 concurrent sessions per user
- ✅ **Session revocation** - Users can revoke individual sessions

### **4. Client-Side Implementation**

The frontend should send the `rememberMe` boolean in the login request:

```javascript
// Example client-side login request
const loginData = {
    identifier: 'username@email.com',
    password: 'password123',
    rememberMe: true,  // ✅ Checkbox state
    twoFactorCode: '123456'  // If 2FA is enabled
};

fetch('/api/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    credentials: 'include',  // ✅ Important for cookies
    body: JSON.stringify(loginData)
});
```

### **5. Session Management**

The system also tracks sessions for security:

```javascript
// Add session to user
await user.addSession({
    sessionId,
    device: req.headers['user-agent'],
    ip: req.ip,
    userAgent: req.headers['user-agent']
});
```

##  **Summary**

**Yes, the Remember Me functionality is fully implemented** with:

- ✅ **Dynamic token expiration** (7 days vs 24 hours)
- ✅ **Dynamic cookie expiration** (7 days vs 24 hours)
- ✅ **Secure cookie configuration**
- ✅ **Session tracking and management**
- ✅ **Security monitoring and audit logging**
- ✅ **Session limits and revocation capabilities**

The implementation follows security best practices and provides a good balance between user convenience and security! 🛡️ 
# 🔧 **Troubleshooting Guide - 404 Login Error**

## 🚨 **Issue: Cannot POST /api/auth/login**

You're getting a 404 error when trying to access the login endpoint. Here's how to resolve this:

## 🔍 **Step-by-Step Troubleshooting**

### **1. Check if Server is Running**

First, verify that your server is actually running:

```bash
# Navigate to server directory
cd server

# Check if server is running
npm start
```

**Expected Output:**
```
🚀 Server is running in development mode on port 5000
🔗 Server URL: http://localhost:5000
🌐 Client URL: http://localhost:3000
🗄️  Database: mongodb://localhost:27017/safawinet
🔒 Security: CORS enabled for http://localhost:3000
🛡️  Security monitoring: ENABLED
🔐 Two-factor authentication: ENABLED
📊 Audit logging: ENABLED
📧 Email notifications: ENABLED
⚡ Rate limiting: ENABLED
🔍 Suspicious activity detection: ENABLED
```

### **2. Test with Simple Server**

If the main server has issues, test with the simplified version:

```bash
# Run test server
npm run test-server
```

**Expected Output:**
```
🚀 Test server running on port 5000
🔗 Server URL: http://localhost:5000
🌐 Test endpoint: http://localhost:5000/api/test
🔐 Login endpoint: http://localhost:5000/api/auth/login
💚 Health check: http://localhost:5000/api/health
```

### **3. Test Endpoints**

Once the server is running, test these endpoints:

#### **Health Check:**
```bash
curl http://localhost:5000/api/health
```

#### **Test Endpoint:**
```bash
curl http://localhost:5000/api/test
```

#### **Login Endpoint:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "alin",
    "password": "alin123M@",
    "rememberMe": false
  }'
```

### **4. Check Dependencies**

Make sure all dependencies are installed:

```bash
# Install dependencies
npm install

# Check for missing dependencies
npm list
```

### **5. Check Environment Variables**

Create or verify your `.env` file:

```bash
# Create .env file if it doesn't exist
touch .env
```

Add these variables to your `.env` file:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/safawinet
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
COOKIE_SECRET=your-super-secret-cookie-key-change-this-in-production
CLIENT_URL=http://localhost:3000
```

### **6. Check MongoDB Connection**

Make sure MongoDB is running:

```bash
# Check if MongoDB is running
mongosh --eval "db.runCommand('ping')"
```

If MongoDB isn't running, start it:

```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
net start MongoDB
```

### **7. Check Port Availability**

Make sure port 5000 is available:

```bash
# Check if port 5000 is in use
lsof -i :5000

# Kill process if needed
kill -9 <PID>
```

### **8. Debug Server Issues**

If the server won't start, check for errors:

```bash
# Run with verbose logging
NODE_ENV=development DEBUG=* npm start

# Check for syntax errors
node -c index.js
```

## 🔧 **Common Issues & Solutions**

### **Issue 1: "Cannot find module"**
**Solution:**
```bash
npm install
```

### **Issue 2: "Port already in use"**
**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=5001 npm start
```

### **Issue 3: "MongoDB connection failed"**
**Solution:**
```bash
# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod           # Linux
net start MongoDB                     # Windows

# Or use a different database URI
MONGODB_URI=mongodb://localhost:27017/test npm start
```

### **Issue 4: "CORS errors"**
**Solution:**
Check your CORS configuration in `server/index.js`:

```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

## 🧪 **Testing Your Login Request**

### **Using curl:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "identifier": "alin",
    "password": "alin123M@",
    "rememberMe": false
  }'
```

### **Using Postman:**
1. **Method:** POST
2. **URL:** `http://localhost:5000/api/auth/login`
3. **Headers:**
   - `Content-Type: application/json`
   - `Accept: application/json`
4. **Body (raw JSON):**
```json
{
  "identifier": "alin",
  "password": "alin123M@",
  "rememberMe": false
}
```

### **Using JavaScript/Fetch:**
```javascript
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    identifier: 'alin',
    password: 'alin123M@',
    rememberMe: false
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## 📋 **Expected Responses**

### **Successful Login:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-id",
      "username": "alin",
      "email": "alin@example.com"
    },
    "token": "jwt-token-here",
    "expiresIn": "24h"
  }
}
```

### **Failed Login:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### **Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["identifier is required", "password is required"]
}
```

## 🆘 **Still Having Issues?**

If you're still getting 404 errors after following these steps:

1. **Check the server logs** for any error messages
2. **Verify the server is running** on the correct port
3. **Test with the simple server** (`npm run test-server`)
4. **Check your network/firewall** settings
5. **Try a different port** if 5000 is blocked

## 📞 **Quick Commands**

```bash
# Start server
npm start

# Start test server
npm run test-server

# Check server health
curl http://localhost:5000/api/health

# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"alin","password":"alin123M@","rememberMe":false}'
```

---

**Follow these steps in order, and your login endpoint should work!** 🚀 
# Configuration Guide

## Environment Variables

Create a `.env` file in the server directory with the following variables:

### Development Environment
```env
NODE_ENV=development
PORT=5000
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/safawinet
```

### Production Environment
```env
NODE_ENV=production
PORT=5000
SERVER_URL=https://your-production-server.com
CLIENT_URL=https://your-production-client.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/safawinet
```

## MongoDB Connection Options

### Local MongoDB
- URI: `mongodb://localhost:27017/safawinet`
- Requires MongoDB installed locally

### MongoDB Atlas (Cloud)
- URI: `mongodb+srv://username:password@cluster.mongodb.net/safawinet`
- Requires MongoDB Atlas account and cluster setup

### MongoDB Atlas with Connection String
- Get connection string from MongoDB Atlas dashboard
- Replace `<password>` with your actual password
- Replace `<dbname>` with your database name

## Current Configuration

The application automatically detects the environment and uses the appropriate configuration:

- **Development**: Uses localhost URLs and local MongoDB
- **Production**: Uses environment variables for production URLs and MongoDB Atlas

## Testing Configuration

You can test the current configuration by visiting:
- Server health: `http://localhost:5000/api/health`
- MongoDB test: `http://localhost:5000/api/test-mongo` 
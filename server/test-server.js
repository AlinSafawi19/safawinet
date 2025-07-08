const express = require('express');
const cors = require('cors');
const { config } = require('./config/config');

const app = express();
const PORT = config.server.port || 5000;

// Basic middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Simple login route for testing
app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  
  const { identifier, password, rememberMe } = req.body;
  
  // Simple validation
  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Identifier and password are required'
    });
  }
  
  // Mock response for testing
  res.json({
    success: true,
    message: 'Login successful (test mode)',
    data: {
      user: {
        id: 'test-user-id',
        username: identifier,
        email: `${identifier}@test.com`
      },
      token: 'test-token-123',
      expiresIn: rememberMe ? '7d' : '24h'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`🔗 Server URL: http://localhost:${PORT}`);
  console.log(`🌐 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down test server...');
  process.exit(0);
}); 
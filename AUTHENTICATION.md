# SafawiNet Authentication System

## Overview

This document describes the secure authentication system implemented for SafawiNet, including both server-side and client-side components.

## Security Features

### Server-Side Security

#### 1. JWT Token Management
- **Secure Token Generation**: Tokens include user ID, username, admin status, and unique session ID
- **Configurable Expiration**: 24 hours default, 7 days with "Remember Me"
- **Token Validation**: Checks issuer, audience, and expiration
- **Automatic Refresh**: Tokens can be refreshed without re-authentication

#### 2. Rate Limiting
- **Login Attempts**: Maximum 5 attempts per 15-minute window
- **IP Blocking**: 30-minute block after exceeding limit
- **Automatic Reset**: Successful login clears failed attempts

#### 3. Password Security
- **Strong Password Requirements**: 
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **Bcrypt Hashing**: 12 salt rounds for secure password storage
- **Password Validation**: Real-time validation with detailed error messages

#### 4. Session Management
- **HTTP-Only Cookies**: Secure cookie storage for tokens
- **SameSite Protection**: Prevents CSRF attacks
- **Secure Flags**: HTTPS-only in production
- **Automatic Cleanup**: Proper session termination on logout

#### 5. Security Headers
- **Helmet Integration**: Comprehensive security headers
- **CORS Protection**: Strict origin validation
- **Content Security Policy**: Prevents XSS attacks
- **XSS Protection**: Additional XSS prevention headers

### Client-Side Security

#### 1. Authentication Service
- **Token Management**: Automatic token storage and retrieval
- **Request Interceptors**: Automatic token inclusion in API calls
- **Response Interceptors**: Automatic token refresh on 401 errors
- **Secure Storage**: LocalStorage with proper cleanup

#### 2. Login Component
- **Form Validation**: Real-time input validation
- **Error Handling**: Comprehensive error messages
- **Rate Limiting**: Client-side attempt tracking
- **Blocking UI**: Visual feedback for blocked attempts
- **Password Visibility**: Toggle password visibility

#### 3. Security Features
- **Auto-logout**: Automatic logout on token expiration
- **Session Persistence**: "Remember Me" functionality
- **Secure Communication**: HTTPS enforcement in production

## API Endpoints

### Authentication Routes

#### POST `/api/auth/login`
- **Purpose**: User authentication
- **Rate Limited**: Yes (5 attempts per 15 minutes)
- **Request Body**:
  ```json
  {
    "identifier": "username|email|phone",
    "password": "password",
    "rememberMe": false
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": { /* user object */ },
      "token": "jwt_token",
      "expiresIn": "24h"
    }
  }
  ```

#### POST `/api/auth/logout`
- **Purpose**: User logout
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "message": "Logout successful"
  }
  ```

#### POST `/api/auth/refresh`
- **Purpose**: Refresh authentication token
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "message": "Token refreshed successfully",
    "data": {
      "token": "new_jwt_token",
      "expiresIn": "24h"
    }
  }
  ```

#### GET `/api/auth/profile`
- **Purpose**: Get current user profile
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "data": { /* user object */ }
  }
  ```

#### PUT `/api/auth/profile`
- **Purpose**: Update user profile
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string"
  }
  ```

#### PUT `/api/auth/change-password`
- **Purpose**: Change user password
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "currentPassword": "string",
    "newPassword": "string"
  }
  ```

#### GET `/api/auth/validate`
- **Purpose**: Validate current token
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "message": "Token is valid",
    "data": {
      "user": { /* user object */ }
    }
  }
  ```

## Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/safawinet

# JWT Configuration (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Security Configuration
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_BLOCK_DURATION_MS=1800000

# Cookie Configuration
COOKIE_SECRET=your-super-secret-cookie-key-change-this-in-production
COOKIE_SECURE=false
COOKIE_SAME_SITE=strict
```

### Production Configuration

For production, ensure:
- `NODE_ENV=production`
- Strong, unique secrets for `JWT_SECRET` and `COOKIE_SECRET`
- `COOKIE_SECURE=true`
- HTTPS URLs for `SERVER_URL` and `CLIENT_URL`
- MongoDB Atlas or secure database connection

## Usage Examples

### Client-Side Authentication

```javascript
import authService from './services/authService';

// Login
const loginResult = await authService.login('username', 'password', true);
if (loginResult.success) {
  console.log('Login successful:', loginResult.user);
}

// Check authentication
if (authService.isUserAuthenticated()) {
  const user = authService.getCurrentUser();
  console.log('Current user:', user);
}

// Check permissions
if (authService.hasPermission('users', 'edit')) {
  console.log('User can edit users');
}

// Logout
await authService.logout();
```

### Server-Side Middleware

```javascript
const { authenticateToken, requireAdmin, requirePermission } = require('./middleware/auth');

// Protected route
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Admin-only route
app.get('/api/admin', authenticateToken, requireAdmin, (req, res) => {
  res.json({ message: 'Admin access granted' });
});

// Permission-based route
app.get('/api/users', authenticateToken, requirePermission('users', 'view'), (req, res) => {
  res.json({ message: 'User list access granted' });
});
```

## Security Best Practices

### 1. Password Security
- Use strong, unique passwords
- Enable "Remember Me" only on trusted devices
- Regularly change passwords
- Never share passwords

### 2. Token Security
- Tokens are automatically managed
- Never manually manipulate tokens
- Logout properly to invalidate sessions
- Tokens expire automatically

### 3. API Security
- All sensitive endpoints require authentication
- Rate limiting prevents brute force attacks
- CORS is properly configured
- Security headers are enforced

### 4. Development Security
- Use different secrets for development and production
- Never commit secrets to version control
- Use environment variables for configuration
- Test security features thoroughly

## Troubleshooting

### Common Issues

1. **Login Fails**: Check username/password, account status
2. **Token Expired**: Automatic refresh should handle this
3. **Rate Limited**: Wait for block to expire or contact admin
4. **CORS Errors**: Check client URL configuration
5. **Database Connection**: Verify MongoDB connection string

### Debug Mode

Enable debug logging in development:
```javascript
// Server-side
console.log('Auth debug:', { user, token });

// Client-side
console.log('Auth state:', authService.getCurrentUser());
```

## Monitoring

### Security Events
- Failed login attempts
- Rate limit blocks
- Token refresh events
- Logout events

### Health Checks
- Database connectivity
- Authentication service status
- Rate limiting status
- Security configuration

## Future Enhancements

1. **Two-Factor Authentication**: SMS/Email verification
2. **OAuth Integration**: Google, Facebook, etc.
3. **Session Management**: Multiple device support
4. **Audit Logging**: Detailed security event logging
5. **Advanced Rate Limiting**: Per-user limits
6. **Password Reset**: Email-based password recovery 
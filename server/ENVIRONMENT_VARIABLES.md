# Environment Variables Configuration Guide

## Complete Environment Variables List

Create a `.env` file in the server directory with ALL the following variables:

```bash
# =============================================================================
# SAFAWINET ENVIRONMENT CONFIGURATION
# =============================================================================

# =============================================================================
# SERVER CONFIGURATION
# =============================================================================
NODE_ENV=development
PORT=5000
SERVER_URL=http://localhost:5000

# =============================================================================
# CLIENT CONFIGURATION
# =============================================================================
CLIENT_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SERVER_URL=http://localhost:5000
REACT_APP_CLIENT_URL=http://localhost:3000

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
MONGODB_URI=mongodb://localhost:27017/safawinet
DB_USER=your-db-username
DB_PASSWORD=your-db-password

# =============================================================================
# JWT CONFIGURATION
# =============================================================================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# =============================================================================
# COOKIE CONFIGURATION
# =============================================================================
COOKIE_SECRET=your-super-secret-cookie-key-change-this-in-production
COOKIE_DOMAIN=localhost

# =============================================================================
# CSRF CONFIGURATION
# =============================================================================
CSRF_SECRET=your-csrf-secret-key-change-this-in-production

# =============================================================================
# EMAIL CONFIGURATION
# =============================================================================
# Gmail Configuration (Current)
SMTP_USER=alinsafawi19@gmail.com
SMTP_PASS=gfcp mfgm mszr ipsg
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# Domain Email Configuration (Future)
# SMTP_USER=your-email@yourdomain.com
# SMTP_PASS=your-domain-email-password
# SMTP_HOST=smtp.yourdomain.com
# SMTP_PORT=587
# SMTP_SECURE=false

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
BCRYPT_SALT_ROUNDS=12

# =============================================================================
# RATE LIMITING CONFIGURATION
# =============================================================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_BLOCK_DURATION_MS=1800000

# =============================================================================
# SMS CONFIGURATION (TWILIO)
# =============================================================================
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```
## Variable Descriptions

### Server Configuration
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port number
- `SERVER_URL`: Full server URL

### Client Configuration
- `CLIENT_URL`: Frontend application URL
- `REACT_APP_API_URL`: API endpoint for React app
- `REACT_APP_SERVER_URL`: Server URL for React app
- `REACT_APP_CLIENT_URL`: Client URL for React app

### Database Configuration
- `MONGODB_URI`: MongoDB connection string
- `DB_USER`: Database username (if using authentication)
- `DB_PASSWORD`: Database password (if using authentication)

### JWT Configuration
- `JWT_SECRET`: Secret key for JWT token signing
- `JWT_EXPIRES_IN`: JWT token expiration time
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expiration time

### Cookie Configuration
- `COOKIE_SECRET`: Secret key for cookie signing
- `COOKIE_DOMAIN`: Domain for cookie setting

### CSRF Configuration
- `CSRF_SECRET`: Secret key for CSRF protection

### Email Configuration
- `SMTP_USER`: Email address for sending emails
- `SMTP_PASS`: Email password or app password
- `SMTP_HOST`: SMTP server hostname
- `SMTP_PORT`: SMTP server port
- `SMTP_SECURE`: Use SSL/TLS (true/false)

### Security Configuration
- `BCRYPT_SALT_ROUNDS`: Number of salt rounds for password hashing

### Rate Limiting Configuration
- `RATE_LIMIT_WINDOW_MS`: Time window for rate limiting (15 minutes)
- `RATE_LIMIT_MAX_ATTEMPTS`: Maximum attempts allowed in window
- `RATE_LIMIT_BLOCK_DURATION_MS`: Block duration after max attempts (30 minutes)

### SMS Configuration (Twilio)
- `TWILIO_ACCOUNT_SID`: Your Twilio Account SID from Twilio Console
- `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token from Twilio Console
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number for sending SMS (format: +1234567890)

## Production Configuration

For production deployment, update these variables:

```bash
# Production Overrides
NODE_ENV=production
PORT=5000
SERVER_URL=https://your-production-server.com
CLIENT_URL=https://your-production-client.com
REACT_APP_API_URL=https://your-production-server.com
REACT_APP_SERVER_URL=https://your-production-server.com
REACT_APP_CLIENT_URL=https://your-production-client.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/safawinet
COOKIE_DOMAIN=yourdomain.com
JWT_SECRET=your-production-jwt-secret-256-bit-key
COOKIE_SECRET=your-production-cookie-secret-256-bit-key
CSRF_SECRET=your-production-csrf-secret-256-bit-key
TWILIO_ACCOUNT_SID=your-production-twilio-sid
TWILIO_AUTH_TOKEN=your-production-twilio-token
TWILIO_PHONE_NUMBER=your-production-twilio-number
```

## Security Requirements

### Strong Secrets (256-bit minimum)
Generate strong secrets using:
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate cookie secret
openssl rand -base64 32

# Generate CSRF secret
openssl rand -base64 32
```

### Environment-Specific Settings

#### Development
- Use localhost URLs
- Use local MongoDB
- Use Gmail for emails
- Enable detailed logging

#### Production
- Use HTTPS URLs
- Use cloud MongoDB
- Use domain email
- Minimize logging
- Enable all security features

## Setup Instructions

1. **Copy the template**: Copy the configuration above
2. **Create `.env` file**: Create in server directory
3. **Update values**: Replace placeholder values with your actual values
4. **Test configuration**: Start server and test functionality
5. **Secure secrets**: Generate strong secrets for production

## Validation

The application validates these environment variables on startup. Missing required variables will cause startup errors.

## Troubleshooting

### Common Issues:
1. **Missing variables**: Check server logs for missing environment variables
2. **Invalid URLs**: Ensure URLs are properly formatted
3. **Database connection**: Verify MongoDB URI and credentials
4. **Email sending**: Check SMTP configuration and credentials
5. **SMS sending**: Verify Twilio credentials and phone number format
6. **JWT errors**: Verify JWT secret is set and strong enough 

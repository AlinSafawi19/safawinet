# SafawiNet Server

This is the backend server for the SafawiNet application with comprehensive user authentication, permission management, and security monitoring.

## Features

- **User Authentication**: Login with username, email, or phone
- **Permission System**: Granular permissions for different pages and actions
- **Admin Management**: Create, update, and manage users and their permissions
- **JWT Authentication**: Secure token-based authentication
- **Two-Factor Authentication**: TOTP-based 2FA with QR codes and backup codes
- **Audit Logging**: Comprehensive activity tracking and security monitoring
- **Email Services**: Password reset, security alerts, and welcome emails
- **Security Monitoring**: Real-time threat detection and suspicious activity alerts
- **Rate Limiting**: Protection against brute force attacks
- **Database Management**: Backup, restore, and maintenance scripts

## Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the server directory:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/safawinet
JWT_SECRET=your-super-secret-jwt-key-here

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Client URL for email links
CLIENT_URL=http://localhost:3000

# Database Authentication (Production)
DB_USER=your-db-user
DB_PASSWORD=your-db-password
```

3. Start MongoDB (if running locally):
```bash
# On Windows
mongod

# On macOS/Linux
sudo systemctl start mongod
```

4. Seed the database with the admin user:
```bash
npm run seed
```

5. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Database Seeding

The seed script creates:
- **Admin User**: Full access to all pages and actions
  - Username: `admin`
  - Email: `admin@safawinet.com`
  - Password: `Admin@123`

### Available Pages and Actions

**Pages:**
- `users` - User management (requires permission)

**Actions:**
- `view` - View data
- `add` - Create new records
- `edit` - Modify existing records
- `delete` - Remove records

**Note:** Dashboard, Audit Logs, and Knowledge Guide are accessible to all authenticated users and do not require specific permissions.

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/2fa/setup` - Setup two-factor authentication
- `POST /api/auth/2fa/verify` - Verify 2FA code
- `POST /api/auth/2fa/disable` - Disable 2FA
- `POST /api/auth/password-reset` - Request password reset
- `POST /api/auth/password-reset/confirm` - Confirm password reset

### User Management (Admin Only)

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get specific user
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/permissions` - Update user permissions
- `GET /api/users/permissions/available` - Get available permissions

### Audit & Security Monitoring

- `GET /api/audit-logs` - Get audit logs with filtering and pagination
- `GET /api/audit-logs/user/:userId` - Get audit logs for specific user
- `GET /api/audit-logs/suspicious` - Get suspicious activity
- `GET /api/audit-logs/failed-logins` - Get failed login attempts
- `GET /api/audit-logs/security-alerts` - Get security alerts
- `GET /api/audit-logs/stats` - Get audit statistics
- `GET /api/security/report` - Get security monitoring report

### Health Check

- `GET /api/health` - Server health status with detailed information
- `GET /api/test` - Test endpoint
- `GET /api/test-mongo` - MongoDB connection test

## Permission System

The system uses a granular permission system where:

1. **Admin users** have full access to all pages and actions
2. **Regular users** have specific permissions assigned by admins
3. **Permissions** are page-specific and action-specific
4. **Actions** include: view, view_own, add, edit, delete, export

### Example Permission Structure

```javascript
permissions: [
  {
    page: 'users',
    actions: ['view', 'view_own', 'add', 'edit', 'delete', 'export']
  },
  {
    page: 'audit_logs',
    actions: ['view', 'view_own', 'export']
  }
]
```

## Security Features

- **Password Security**: Hashing with bcrypt
- **JWT Authentication**: Secure token-based authentication
- **Two-Factor Authentication**: TOTP with QR codes and backup codes
- **Input Validation**: Comprehensive validation and sanitization
- **CORS Configuration**: Secure cross-origin resource sharing
- **Rate Limiting**: Protection against brute force attacks
- **Security Headers**: Helmet.js for security headers
- **Audit Logging**: Complete activity tracking
- **Suspicious Activity Detection**: Real-time threat monitoring
- **Email Security Alerts**: Automated security notifications
- **Environment-based Configuration**: Secure production settings

## Database Management

### Available Scripts

- `npm run seed` - Seed database with initial data
- `npm run check-db` - Check database connection and status
- `npm run backup-db` - Create database backup
- `npm run restore-db` - Restore database from backup
- `npm run delete-db` - Delete database (use with caution)

### Database Operations

```bash
# Check database status
npm run check-db

# Create backup
npm run backup-db

# Restore from backup
npm run restore-db
```

## Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with initial data
- `npm run test-server` - Test server configuration
- `npm run check-db` - Check database connection
- `npm run backup-db` - Backup database
- `npm run restore-db` - Restore database
- `npm run delete-db` - Delete database

### Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_SECURE` - Use SSL/TLS for SMTP
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `CLIENT_URL` - Frontend URL for email links
- `DB_USER` - Database username (production)
- `DB_PASSWORD` - Database password (production)
- `TWILIO_ACCOUNT_SID` - Twilio Account SID for SMS
- `TWILIO_AUTH_TOKEN` - Twilio Auth Token for SMS
- `TWILIO_PHONE_NUMBER` - Twilio phone number for SMS

## Email Services

The server includes comprehensive email functionality:

- **Password Reset Emails**: Secure password reset links
- **Security Alert Emails**: Notifications for suspicious activity
- **Two-Factor Setup Emails**: 2FA configuration instructions
- **Account Locked Emails**: Account security notifications
- **Welcome Emails**: New user onboarding

### Email Configuration

Configure email settings in your `.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CLIENT_URL=http://localhost:3000
```

## SMS Services

The server includes SMS verification functionality using Twilio:

- **Phone Verification**: Send verification codes via SMS
- **Verification Confirmation**: Confirm successful phone verification
- **Phone Number Validation**: Validate phone number formats
- **International Support**: Support for international phone numbers

### SMS Configuration

Configure SMS settings in your `.env` file:

```env
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

### SMS Setup

For detailed SMS setup instructions, see [SMS_SETUP.md](./SMS_SETUP.md).

**Note**: SMS functionality requires a Twilio account and proper configuration. The system will not start without valid Twilio credentials.

## Audit Logging

The system maintains comprehensive audit logs for:

- **User Actions**: Login, logout, profile updates
- **Admin Operations**: User management, permission changes
- **Security Events**: Failed logins, suspicious activity
- **System Events**: Database operations, configuration changes

### Audit Log Features

- **Filtering**: By user, action, IP, date range
- **Pagination**: Efficient data retrieval
- **Risk Assessment**: Automatic risk level assignment
- **Suspicious Activity Detection**: Real-time threat monitoring
- **Statistics**: Detailed analytics and reporting

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Success Responses

Successful operations return:

```json
{
  "success": true,
  "message": "Operation description",
  "data": { /* response data */ }
}
```

## Security Monitoring

The server includes advanced security monitoring:

- **Real-time Threat Detection**: Monitors for suspicious patterns
- **Rate Limiting**: Prevents brute force attacks
- **IP Tracking**: Logs and analyzes IP addresses
- **Device Fingerprinting**: Tracks user devices
- **Security Reports**: Comprehensive security analytics

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure HTTPS
4. Set up proper MongoDB authentication
5. Configure email services
6. Enable security monitoring
7. Set up regular database backups

## Troubleshooting

### Common Issues

1. **MongoDB Connection**: Ensure MongoDB is running and accessible
2. **Email Configuration**: Verify SMTP settings and credentials
3. **SMS Configuration**: Verify Twilio credentials and phone number format
4. **JWT Issues**: Check JWT_SECRET configuration
5. **Permission Errors**: Verify user permissions and roles
6. **Rate Limiting**: Check for excessive API calls

### Debug Commands

```bash
# Test server configuration
npm run test-server

# Test SMS configuration
npm run test-sms

# Check database connection
npm run check-db

# Test email configuration
node test-email.js
``` 
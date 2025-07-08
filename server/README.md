# SafawiNet Server

This is the backend server for the SafawiNet application with user authentication and permission management.

## Features

- **User Authentication**: Login with username, email, or phone
- **Permission System**: Granular permissions for different pages and actions
- **Admin Management**: Create, update, and manage users and their permissions
- **JWT Authentication**: Secure token-based authentication

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
- `dashboard` - Main dashboard
- `users` - User management
- `reports` - Reports and analytics
- `settings` - System settings
- `analytics` - Data analytics
- `inventory` - Inventory management
- `sales` - Sales management
- `customers` - Customer management

**Actions:**
- `view` - View data
- `add` - Create new records
- `edit` - Modify existing records
- `delete` - Remove records

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verify token

### User Management (Admin Only)

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get specific user
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/permissions` - Update user permissions
- `GET /api/users/permissions/available` - Get available permissions

### Health Check

- `GET /api/health` - Server health status
- `GET /api/test` - Test endpoint
- `GET /api/test-mongo` - MongoDB connection test

## Permission System

The system uses a granular permission system where:

1. **Admin users** have full access to all pages and actions
2. **Regular users** have specific permissions assigned by admins
3. **Permissions** are page-specific and action-specific
4. **Actions** include: view, add, edit, delete

### Example Permission Structure

```javascript
permissions: [
  {
    page: 'dashboard',
    actions: ['view']
  },
  {
    page: 'users',
    actions: ['view', 'add', 'edit']
  },
  {
    page: 'inventory',
    actions: ['view', 'add', 'edit', 'delete']
  }
]
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- CORS configuration
- Environment-based configuration

## Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with initial data

### Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens

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
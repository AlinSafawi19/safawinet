# Frontend Configuration Guide

## Environment Variables

Create a `.env` file in the client directory with the following variables:

### Development Environment
```env
REACT_APP_NODE_ENV=development
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SERVER_URL=http://localhost:5000
REACT_APP_CLIENT_URL=http://localhost:3000
```

### Production Environment
```env
REACT_APP_NODE_ENV=production
REACT_APP_API_URL=https://your-production-server.com/api
REACT_APP_SERVER_URL=https://your-production-server.com
REACT_APP_CLIENT_URL=https://your-production-client.com
```

## Using Configuration in Components

Import and use the configuration in your React components:

```javascript
import config from './config/config';

// Example API call
const response = await fetch(`${config.apiUrl}/test`);
```

## Environment Detection

The application automatically detects the environment:
- **Development**: Uses localhost URLs
- **Production**: Uses environment variables for production URLs

## Important Notes

- All React environment variables must start with `REACT_APP_`
- Environment variables are embedded during build time
- Changes to environment variables require restarting the development server 
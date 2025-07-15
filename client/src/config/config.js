const config = {
  development: {
    apiUrl: 'http://localhost:5000/api',
    serverUrl: 'http://localhost:5000',
    clientUrl: 'http://localhost:3002'
  },
  production: {
    apiUrl: process.env.REACT_APP_API_URL || 'https://your-production-server.com/api',
    serverUrl: process.env.REACT_APP_SERVER_URL || 'https://your-production-server.com',
    clientUrl: process.env.REACT_APP_CLIENT_URL || 'https://your-production-client.com'
  }
};

const env = process.env.NODE_ENV || 'development';
const currentConfig = config[env];

export default currentConfig; 
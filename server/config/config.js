const config = {
  development: {
    server: {
      port: process.env.PORT || 5000,
      url: 'http://localhost:5000'
    },
    client: {
      url: 'http://localhost:3002'
    },
    database: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/safawinet'
    }
  },
  production: {
    server: {
      port: process.env.PORT || 5000,
      url: process.env.SERVER_URL || 'https://your-production-server.com'
    },
    client: {
      url: process.env.CLIENT_URL || 'https://your-production-client.com'
    },
    database: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/safawinet'
    }
  }
};

const env = process.env.NODE_ENV || 'development';
const currentConfig = config[env];

module.exports = {
  config: currentConfig,
  env,
  isDevelopment: env === 'development',
  isProduction: env === 'production'
}; 
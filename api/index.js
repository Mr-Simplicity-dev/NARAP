const serverless = require('serverless-http');
const { app } = require('./server'); // Remove connectDB import

// ✅ Don't connect to DB on cold start
console.log('🚀 Serverless function initialized');

module.exports = serverless(app);

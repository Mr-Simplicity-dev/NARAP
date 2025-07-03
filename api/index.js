// File: api/index.js
const serverless = require('serverless-http');
const { app, connectDB } = require('./server');

// Ensure DB connects on cold start (serverless environment)
connectDB()
  .then(() => console.log('💾 MongoDB connected (serverless)'))
  .catch(err => console.error('❌ MongoDB connect failed (serverless):', err));

// Export the Express app wrapped as a Vercel serverless function
module.exports = serverless(app);

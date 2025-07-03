// File: api/index.js
const serverless = require('serverless-http');
const { app, connectDB } = require('./server');

// Cold-start DB connection
connectDB().catch(err =>
  console.error('❌ MongoDB connect failed (serverless):', err)
);

// Only wrap once here:
module.exports = serverless(app);

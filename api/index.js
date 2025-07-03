const serverless = require('serverless-http');
const { app, connectDB } = require('./server');

// Ensure DB is connected on cold start
connectDB().catch(err => {
  console.error('❌ Serverless DB connect failed:', err);
});

module.exports = serverless(app);

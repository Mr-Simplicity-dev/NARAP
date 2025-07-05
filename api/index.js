const serverless = require('serverless-http');
const { app, connectDB } = require('./server');

// Cold-start DB connection with better error handling
connectDB()
  .then(() => console.log('✅ MongoDB connected (serverless)'))
  .catch(err => {
    console.error('❌ MongoDB connect failed (serverless):', err);
    // Don't throw here, let individual requests handle connection
  });

module.exports = serverless(app);

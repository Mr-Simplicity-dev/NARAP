const serverless = require('serverless-http');
const { app, connectDB } = require('./server');

// Ensure Mongo connects on cold start
connectDB()
  .then(() => console.log('💾 MongoDB connected (serverless)'))
  .catch(err => console.error('❌ Mongo connect failed:', err));


module.exports = serverless(app);

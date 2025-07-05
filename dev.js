// File: dev.js (for local development)
require('dotenv').config();
const { app, connectDB } = require('./api/server');

console.log('🚀 Starting NARAP Backend in development mode...');

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🛡️  Local server listening on http://localhost:${PORT}`);
      console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch(err => {
    console.error('❌ DB connection failed:', err);
    process.exit(1);
  });

const serverless = require('serverless-http');
const expressApp = require('./server'); // Load the full backend
module.exports = serverless(expressApp);

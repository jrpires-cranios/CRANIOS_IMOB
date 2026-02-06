const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Simple health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Crânios IMOB API is running',
    timestamp: new Date().toISOString() 
  });
});

// Root
app.get('/', (req, res) => {
  res.json({ name: 'Crânios IMOB API', version: '1.0.0' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
});

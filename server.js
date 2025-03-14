const express = require('express');
const path = require('path');
const app = express();

// Serve static files from dist directory
app.use(express.static('dist'));

// API routes
app.use('/api', require('./api/server.py'));

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

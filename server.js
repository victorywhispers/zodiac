const express = require('express');
const path = require('path');
const app = express();

// Serve static files from dist directory
app.use(express.static('dist'));

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});

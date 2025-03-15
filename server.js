import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    
    return {
        root: 'src',
        build: {
            target: 'esnext',
            outDir: '../dist', // Change this line
            emptyOutDir: true,
            assetsDir: 'assets',
        },
        envDir: '../',
        envPrefix: 'VITE_',
        server: {
            proxy: {
                '/api': {
                    target: process.env.API_URL || 'http://localhost:5000',
                    changeOrigin: true
                }
            }
        }
    }
})

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

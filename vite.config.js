import { defineConfig } from 'vite'

export default defineConfig({
    root: 'src',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        target: 'esnext',  // Add this to support top-level await
    },
    preview: {
        port: process.env.PORT || 3000,
        host: '0.0.0.0'
    }
})

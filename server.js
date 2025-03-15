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

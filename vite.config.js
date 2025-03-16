import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    
    return {
        root: 'src',
        build: {
            target: 'esnext',
            outDir: '../dist',
            emptyOutDir: true,
        },
        envDir: '../',
        envPrefix: 'VITE_',
        server: {
            proxy: {
                '/weaviate': {
                    target: `https://${env.VITE_WEAVIATE_URL}`,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/weaviate/, ''),
                    headers: {
                        'Authorization': `Bearer ${env.VITE_WEAVIATE_API_KEY}`
                    }
                }
            }
        }
    }
})
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: Number(env.VITE_PORT) || 5173,
      proxy: {
        '/admin': {
          target: env.VITE_API_URL || 'http://localhost:8003',
          changeOrigin: true,
        },
      },
    },
  build: {
    outDir: '../static/frontend',
    emptyOutDir: true,
    // Optimizaciones de build
    minify: 'esbuild', // Más rápido que terser
    // Eliminar console.log en producción (se puede hacer con esbuild también)
    // Code splitting optimizado
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['recharts'],
          'ui-vendor': ['lucide-react'],
          // Separar páginas grandes
          'pages-heavy': [
            './src/pages/BasesDatos',
            './src/pages/DTEList',
            './src/pages/ClienteDetail',
          ],
        },
      },
    },
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
    // Optimizaciones de desarrollo
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'axios', 'zustand'],
    },
  }
})


import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'
  
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
      // Target moderno para bundles más pequeños
      target: 'es2020',
      // Minificación agresiva con esbuild
      minify: 'esbuild',
      // Eliminar console.log y debugger
      esbuild: {
        drop: isProd ? ['console', 'debugger'] : [],
        legalComments: 'none',
      },
      // CSS optimizado
      cssMinify: true,
      cssCodeSplit: true,
      // Source maps solo en dev
      sourcemap: false,
      // Reportar tamaños comprimidos
      reportCompressedSize: true,
      // Rollup optimizado
      rollupOptions: {
        output: {
          // Nombres de chunks más cortos
          chunkFileNames: 'assets/[name]-[hash:8].js',
          entryFileNames: 'assets/[name]-[hash:8].js',
          assetFileNames: 'assets/[name]-[hash:8].[ext]',
          // Code splitting simple y efectivo
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-charts': ['recharts'],
            'vendor-ui': ['lucide-react', 'axios', 'zustand', 'date-fns'],
          },
        },
      },
      // Límite de warning
      chunkSizeWarningLimit: 500,
    },
    // Pre-bundle dependencias
    optimizeDeps: {
      include: [
        'react', 
        'react-dom', 
        'react-router-dom', 
        'axios', 
        'zustand',
        'lucide-react',
        'date-fns'
      ],
      // Excluir heavy deps del prebundle
      exclude: ['recharts'],
    },
    // Reducir overhead de HMR en dev
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
    },
  }
})


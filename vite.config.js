import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],

  // ========== PATH RESOLUTION ==========
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@views': fileURLToPath(new URL('./src/views', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url))
    }
  },

  // ========== SERVER/PROXY CONFIG ==========
  server: {
    proxy: {
      '/api': {
        target: 'https://script.google.com',
        changeOrigin: true,
        secure: false,
rewrite: (path) =>
path.replace(
  /^\/api/,
  '/macros/s/AKfycbwGZSKYX-uhOx-pJFMQY8E7PB9yn1js7-W7u8VCbNZFg9Ziu22WMO3xvdn293kUG7eVHQ/exec'
),

        configure: (proxy) => {
          // Modify request headers
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('Content-Type', 'application/json');
          });

          // Modify response headers
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['content-type'] = 'application/json';
          });
        },

        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Forwarded-Proto': 'https'
        }
      }
    },

    // Development server options
    host: true,
    port: 5173,
    strictPort: true,
    open: true,
  },

  // ========== BUILD OPTIMIZATIONS ==========
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue', 'vue-router', 'pinia'],
          vendor: ['axios', 'lodash'],
          
        },
       
      }
    },

    // Additional optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },

  // ========== CSS/CSS PREPROCESSORS ==========
  css: {
    postcss: './postcss.config.js',
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@assets/styles/variables.scss";`
      }
    }
  },

  // ========== ADDITIONAL OPTIMIZATIONS ==========
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'axios'
    ],
    exclude: ['google-apps-script']
  }
})

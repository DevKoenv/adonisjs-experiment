import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import adonisjs from '@adonisjs/vite/client'
import inertia from '@adonisjs/inertia/client'
import vue from '@vitejs/plugin-vue'
import path, { resolve } from 'node:path'
import url from 'node:url'

export default defineConfig({
  plugins: [
    tailwindcss(),
    inertia({ ssr: { enabled: false } }),
    vue(),
    adonisjs({
      entrypoints: ['inertia/assets/js/app.ts'],
      reload: [
        'resources/views/**/*.edge',
        'inertia/**/*.vue',
        'inertia/**/*.ts',
        'inertia/**/*.js',
        'inertia/**/*.css',
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(path.dirname(url.fileURLToPath(import.meta.url)), './inertia'),
      '~': resolve(path.dirname(url.fileURLToPath(import.meta.url)), './inertia'),
    },
  },
  build: {
    // Ensure CSS is extracted and properly processed
    cssCodeSplit: true,
    assetsInlineLimit: 0,
  },
})

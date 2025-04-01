import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import adonisjs from '@adonisjs/vite/client'
import inertia from '@adonisjs/inertia/client'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

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
        'resources/**/*.css',
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'inertia'),
    },
  },
})

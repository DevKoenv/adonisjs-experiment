import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import adonisjs from '@adonisjs/vite/client'
import inertia from '@adonisjs/inertia/client'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    tailwindcss(),
    inertia({ ssr: { enabled: false } }),
    vue(),
    adonisjs({
      entrypoints: ['inertia/app/app.ts'],
      reload: ['resources/views/**/*.edge', 'inertia/**/*.vue', 'inertia/**/*.ts'],
    }),
  ],
})

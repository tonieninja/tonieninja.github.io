import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),  // teraz '@' → folder 'src'
    },
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
})

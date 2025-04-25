import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/tonieninja.github.io/',
  plugins: [react()],
})

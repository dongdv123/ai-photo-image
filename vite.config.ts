import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'gemini': ['@google/generative-ai'],
          'vendor': ['react', 'react-dom'],
        },
      },
    },
  },
})


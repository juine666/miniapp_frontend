import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/admin/',        // ← 这里加上 base 路径
  plugins: [react()],
  server: { port: 5173 }
})
















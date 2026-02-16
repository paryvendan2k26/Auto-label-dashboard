// client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Remove or comment out the proxy - not needed anymore
  // server: {
  //   proxy: {
  //     '/api': 'http://localhost:5000'
  //   }
  // }
})
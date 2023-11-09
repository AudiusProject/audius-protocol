import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  // Set to /up/ in Dockerfile. Leave unset ("/") if deploying standalone in the future (e.g., to Cloudflare Pages).
  base: process.env.UPTIME_BASE_URL || "/",
})

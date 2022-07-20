import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import codegen from 'vite-plugin-graphql-codegen'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [codegen(), react()],
})

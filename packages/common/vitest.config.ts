import { defineConfig } from 'vitest/config'

export default defineConfig(() => {
  return {
    resolve: {
      alias: {
        '~': '/src'
      }
    }
  }
})

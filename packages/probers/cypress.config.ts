import { defineConfig } from 'cypress'

export default defineConfig({
  userAgent: 'probers',
  defaultCommandTimeout: 10000,
  retries: {
    runMode: 2,
    openMode: 0
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.ts').default(on, config)
    },
    baseUrl: 'http://localhost:3001'
  },
  viewportHeight: 800,
  viewportWidth: 1300
})

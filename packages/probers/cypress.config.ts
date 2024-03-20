import { defineConfig } from 'cypress'

const defaultConfig = {
  baseUrl: 'http://localhost:3001',
  env: {
    initialLoadTimeout: 10000
  }
}

export default defineConfig({
  userAgent: 'probers',
  retries: {
    runMode: 2,
    openMode: 0
  },
  viewportHeight: 800,
  viewportWidth: 1300,
  video: true,
  e2e: {
    setupNodeEvents(on, config) {
      const configFile = config.env.configFile || 'dev'
      const envConfig = require(`./cypress/config/${configFile}.json`)
      const mergedConfig = { ...defaultConfig, ...envConfig }
      console.info(`Using config:\n ${JSON.stringify(mergedConfig, null, 2)}`)
      return mergedConfig
    }
  }
})

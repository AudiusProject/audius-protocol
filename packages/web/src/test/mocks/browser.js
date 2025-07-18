/* eslint-disable */

import { setupWorker } from 'msw/browser'

import { coinApiHandlers } from './coin-api'

// Create and export the worker
export const worker = setupWorker(...coinApiHandlers)

// Initialize MSW at app root level
export const initializeMSW = () => {
  // Only initialize in development/staging environments
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    try {
      worker.start({
        onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
        serviceWorker: {
          url: '/mockServiceWorker.js'
        },
        quiet: true // Reduce console noise
      })
      console.log('🔧 MSW initialized for wallet API mocks')
    } catch (error) {
      console.warn('⚠️ MSW initialization failed:', error.message)
    }
  }
}

// Auto-initialize if this module is imported directly
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  initializeMSW()
}

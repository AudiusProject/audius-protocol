/* eslint-disable */

import { setupWorker } from 'msw/browser'

import { walletApiHandlers } from './wallet-api'

// Create and export the worker
export const worker = setupWorker(...walletApiHandlers)

// Start the worker when this module is imported
if (typeof window !== 'undefined') {
  worker.start({
    onUnhandledRequest: 'bypass' // Don't warn about unhandled requests
  })
}

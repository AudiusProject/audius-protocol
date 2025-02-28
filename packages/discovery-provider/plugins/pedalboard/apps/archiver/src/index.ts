import cors from 'cors'
import express from 'express'
import { log } from '@pedalboard/logger'

import { readConfig } from './config'

// Basic health check endpoint
const health = (_req: express.Request, res: express.Response) => {
  res.json({ status: 'healthy' })
}

const main = async () => {
  const config = readConfig()
  // Initialize express app
  const app = express()
  app.use(cors())

  // Add routes
  app.get('/archive/health_check', health)

  // Start the server
  app.listen(config.serverPort, config.serverHost, () => {
    log(`Server initialized on ${config.serverHost}:${config.serverPort}`)
  })
}

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled promise rejection: ${reason}, promise: ${promise}`)
})

main().catch(log)

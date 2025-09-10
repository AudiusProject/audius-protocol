import { json } from 'body-parser'
import cors from 'cors'
import express from 'express'
import multer from 'multer'

import { config } from './config'
import { logger } from './logger'
import { errorHandlerMiddleware } from './middleware/errorHandler'
import {
  incomingRequestLogger,
  outgoingRequestLogger
} from './middleware/logging'
import {
  userSignerRecoveryMiddleware,
  discoveryNodeSignerRecoveryMiddleware
} from './middleware/signerRecovery'
import { cache } from './routes/cache'
import { feePayer } from './routes/feePayer'
import { health } from './routes/health/health'
import { location } from './routes/instruction/location'
import { launchCoin } from './routes/launchpad/launch_coin'
import { listen } from './routes/listen/listen'
import { relay } from './routes/relay/relay'

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', { promise, reason })
})

const main = async () => {
  const { serverHost, serverPort } = config
  const app = express()
  app.use(json())
  app.use(cors())
  app.use(incomingRequestLogger)
  app.get('/solana/health_check', health)
  app.post('/solana/tracks/:trackId/listen', listen)

  // launch_coin doesn't need user/discovery validation, so register it before middleware
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
  })
  app.post('/solana/launch_coin', upload.single('image'), launchCoin)

  // Apply middleware for routes that need user/discovery validation
  app.use(userSignerRecoveryMiddleware)
  app.use(discoveryNodeSignerRecoveryMiddleware)
  app.post('/solana/relay', relay)
  app.post('/solana/cache', cache)
  app.get('/solana/feePayer', feePayer)
  app.get('/solana/instruction/location', location)
  app.use(outgoingRequestLogger)
  app.use(errorHandlerMiddleware)

  const server = app.listen(serverPort, serverHost, () => {
    logger.info({ serverHost, serverPort }, 'server initialized')
  })

  // Set server timeout to 3 minutes to accommodate long-running requests (like launch_coin)
  server.timeout = 3 * 60 * 1000
}

main().catch((e) => logger.error({ error: e }, 'Fatal error in main!'))

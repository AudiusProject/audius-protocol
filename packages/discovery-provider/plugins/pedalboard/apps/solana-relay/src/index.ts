import { json } from 'body-parser'
import cors from 'cors'
import express from 'express'

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
import { listen } from './routes/listen/listen'
import { relay } from './routes/relay/relay'

const main = async () => {
  const { serverHost, serverPort } = config
  const app = express()
  app.use(json())
  app.use(cors())
  app.use(incomingRequestLogger)
  app.get('/solana/health_check', health)
  app.post('/solana/tracks/:trackId/listen', listen)
  app.use(userSignerRecoveryMiddleware)
  app.use(discoveryNodeSignerRecoveryMiddleware)
  app.post('/solana/relay', relay)
  app.post('/solana/cache', cache)
  app.get('/solana/feePayer', feePayer)
  app.use(outgoingRequestLogger)
  app.use(errorHandlerMiddleware)

  app.listen(serverPort, serverHost, () => {
    logger.info({ serverHost, serverPort }, 'server initialized')
  })
}

main().catch((e) => logger.error({ error: e }, 'Fatal error in main!'))

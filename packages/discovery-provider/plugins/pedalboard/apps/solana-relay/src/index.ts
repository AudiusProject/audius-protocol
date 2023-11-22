import express from 'express'
import { json } from 'body-parser'
import cors from 'cors'
import { config } from './config'
import { logger } from './logger'
import {
  incomingRequestLogger,
  outgoingRequestLogger
} from './middleware/logging'
import { relay } from './routes/relay/relay'
import { errorHandlerMiddleware } from './middleware/errorHandler'
import { signerRecoveryMiddleware } from './middleware/signerRecovery'

const main = async () => {
  const { serverHost, serverPort } = config
  const app = express()
  app.use(json())
  app.use(cors())
  app.use(signerRecoveryMiddleware)
  app.post('/solana/relay', incomingRequestLogger, relay, outgoingRequestLogger)
  app.use(errorHandlerMiddleware)

  app.listen(serverPort, serverHost, () => {
    logger.info({ serverHost, serverPort }, 'server initialized')
  })
}

main().catch(logger.error.bind(logger))

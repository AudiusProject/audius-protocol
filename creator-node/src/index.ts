/* eslint-disable import/first */
'use strict'

console.log('Starting up...')
const globalStartTimeMS = Date.now()

// Libs takes a long time to import, so import it first.
// Otherwise some other part of the init process appears slow and is hard to debug, but it's really just because it's importing libs.
const { libs: _ } = require('@audius/sdk')
console.log(`Importing libs took ${(Date.now() - globalStartTimeMS) / 1000}s`)

import config from './config'

import { setupTracing } from './tracer'
setupTracing()

import ON_DEATH from 'death'
import { Keypair } from '@solana/web3.js'

import { initializeApp } from './app'
import { serviceRegistry } from './serviceRegistry'
import { runMigrations, clearRunningQueries } from './migrationManager'

import { logger } from './logging'
import { sequelize } from './models'
import {
  emptyTmpTrackUploadArtifacts,
  sweepSubdirectoriesInFiles
} from './diskManager'

const EthereumWallet = require('ethereumjs-wallet')
const redisClient = require('./redis')

function debugLogTimer(message: string) {
  // Make times lineup in grepped logs i.e.
  // 'LogTimer: startApp.serviceRegistry.initServices - 0.625s'
  // 'LogTimer: startApp.initializeApp                - 7.673s'
  const padWidth = 60
  logger.debug(
    `LogTimer: ${message}`.padEnd(padWidth) +
      `- ${(Date.now() - globalStartTimeMS) / 1000}s`
  )
}

const exitWithError = (...msg: any[]) => {
  logger.error('ERROR: ', ...msg)
  // eslint-disable-next-line no-process-exit
  process.exit(1)
}

const verifyConfigAndDb = async () => {
  await config.asyncConfig()
  const delegateOwnerWallet = config.get('delegateOwnerWallet')
  const delegatePrivateKey = config.get('delegatePrivateKey')
  const creatorNodeEndpoint = config.get('creatorNodeEndpoint')

  if (!delegateOwnerWallet || !delegatePrivateKey || !creatorNodeEndpoint) {
    exitWithError(
      'Cannot startup without delegateOwnerWallet, delegatePrivateKey, and creatorNodeEndpoint'
    )
  }

  // Fail if delegateOwnerWallet doesn't derive from delegatePrivateKey
  const privateKeyBuffer = Buffer.from(
    config.get('delegatePrivateKey').replace('0x', ''),
    'hex'
  )
  const walletAddress =
    EthereumWallet.fromPrivateKey(privateKeyBuffer).getAddressString()
  if (walletAddress !== config.get('delegateOwnerWallet').toLowerCase()) {
    throw new Error('Invalid delegatePrivateKey/delegateOwnerWallet pair')
  }
  try {
    const solDelegateKeypair = Keypair.fromSeed(privateKeyBuffer)
    const solDelegatePrivateKey = solDelegateKeypair.secretKey
    config.set(
      'solDelegatePrivateKeyBase64',
      Buffer.from(solDelegatePrivateKey).toString('base64')
    )
  } catch (e: any) {
    logger.error(
      `Failed to create and set solDelegatePrivateKeyBase64: ${e.message}`
    )
  }

  try {
    logger.info('Verifying DB connection...')
    await sequelize.authenticate() // runs SELECT 1+1 AS result to check db connection
    logger.info('DB connected successfully!')
  } catch (connectionError) {
    exitWithError('Error connecting to DB:', connectionError)
  }
}

/**
 * Setting a different port is necessary for OpenResty to work. If OpenResty
 * is enabled, have the app run on port 3000. Else, run on its configured port.
 * @returns the port number to configure the Content Node app
 */
const getPort = () => {
  const contentCacheLayerEnabled = config.get('contentCacheLayerEnabled')

  if (contentCacheLayerEnabled) {
    return 3000
  }

  return config.get('port')
}

const runAsyncBackgroundTasks = async () => {
  if (config.get('backgroundDiskCleanupCheckEnabled')) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    sweepSubdirectoriesInFiles()
  }
}

const main = async () => {
  debugLogTimer('main')
  logger.info(`Starting app`)
  debugLogTimer('main.setupDbAndRedis')
  await setupDbAndRedis()

  const startTime = Date.now()
  debugLogTimer('startAppForPrimary.emptyTmpTrackUploadArtifacts')
  const size = await emptyTmpTrackUploadArtifacts()
  logger.info(
    `old tmp track artifacts deleted : ${size} : ${
      (Date.now() - startTime) / 1000
    }sec`
  )

  debugLogTimer('main.startApp')
  await startApp()

  // Don't await this - these are recurring tasks that run in the background after
  // a one minute delay to avoid causing init to degrade
  setTimeout(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    runAsyncBackgroundTasks()
  }, 60_000)
}

const setupDbAndRedis = async () => {
  await verifyConfigAndDb()
  await clearRunningQueries()
  try {
    logger.info('Executing database migrations...')
    await runMigrations()
    logger.info('Migrations completed successfully')
  } catch (migrationError) {
    exitWithError('Error in migrations:', migrationError)
  }

  // Clear all redis locks
  try {
    await redisClient.WalletWriteLock.clearWriteLocks()
  } catch (e: any) {
    logger.warn(`Could not clear write locks. Skipping..: ${e.message}`)
  }
}

const startApp = async () => {
  // When app terminates, close down any open DB connections gracefully
  ON_DEATH({ uncaughtException: true })((signal, error) => {
    // NOTE: log messages emitted here may be swallowed up if using the bunyan CLI (used by
    // default in `npm start` command). To see messages emitted after a kill signal, do not
    // use the bunyan CLI.
    logger.error('Shutting down db and express app...', signal, error)
    sequelize.close()
    if (appInfo) {
      appInfo.server.close()
    }
  })
  debugLogTimer('startApp.serviceRegistry.initServices')
  await serviceRegistry.initServices()
  const nodeMode = config.get('devMode') ? 'Dev Mode' : 'Production Mode'
  logger.info(`Initialized services (Node running in ${nodeMode})`)

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  serviceRegistry.initServicesAsynchronously()
  debugLogTimer('startApp.initializeApp')
  const appInfo = initializeApp(getPort(), serviceRegistry)
  debugLogTimer('startApp.initialized')
  logger.info('Initialized app and server')
  await serviceRegistry.initServicesThatRequireServer(appInfo.app)
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main()

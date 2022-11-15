/* eslint-disable import/first */
'use strict'

import { setupTracing } from './tracer'
setupTracing()

import type { Worker } from 'cluster'
import { AggregatorRegistry } from 'prom-client'
import { clusterUtils } from './utils'
import cluster from 'cluster'

import ON_DEATH from 'death'
import { Keypair } from '@solana/web3.js'

import { initializeApp } from './app'
import config from './config'
import { serviceRegistry } from './serviceRegistry'
import { runMigrations, clearRunningQueries } from './migrationManager'
import DBManager from './dbManager'

import { logger } from './logging'
import { sequelize } from './models'
import {
  emptyTmpTrackUploadArtifacts,
  sweepSubdirectoriesInFiles
} from './diskManager'

const EthereumWallet = require('ethereumjs-wallet')
const redisClient = require('./redis')

// This should eventually only be instantiated in the primary and then workers should call setupClusterWorker().
// However, a bug currently requires instantiating this in workers as well:
// https://github.com/siimon/prom-client/issues/501
const aggregatorRegistry = new AggregatorRegistry()

const globalStartTimeMS = Date.now()
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

  // Fail if Trusted Notifier isn't configured properly
  const trustedNotifierEnabled = !!config.get('trustedNotifierID')
  const nodeOperatorEmailAddress = config.get('nodeOperatorEmailAddress')
  if (!trustedNotifierEnabled && !nodeOperatorEmailAddress) {
    exitWithError(
      'Cannot startup without a trustedNotifierID or nodeOperatorEmailAddress'
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

// The primary process performs one-time validation and spawns worker processes that each run the Express app
const startAppForPrimary = async () => {
  debugLogTimer('startAppForPrimary')
  logger.info(`Primary process with pid=${process.pid} is running`)

  debugLogTimer('startAppForPrimary.setupDbAndRedis')
  await setupDbAndRedis()

  const startTime = Date.now()
  debugLogTimer('startAppForPrimary.emptyTmpTrackUploadArtifacts')
  const size = await emptyTmpTrackUploadArtifacts()
  logger.info(
    `old tmp track artifacts deleted : ${size} : ${
      (Date.now() - startTime) / 1000
    }sec`
  )

  // Don't await - run in background. Remove after v0.3.69
  // See https://linear.app/audius/issue/CON-477/use-proper-migration-for-storagepath-index-on-files-table
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  DBManager.createStoragePathIndexOnFilesTable()

  const numWorkers = clusterUtils.getNumWorkers()
  logger.info(`Spawning ${numWorkers} processes to run the Express app...`)
  const firstWorker = cluster.fork({ isInitWorker: true })
  // Wait for the first worker to perform one-time init logic before spawning other workers
  firstWorker.on('message', (msg) => {
    if (msg?.cmd === 'initComplete') {
      for (let i = 0; i < numWorkers - 1; i++) {
        cluster.fork()
      }
    }
  })

  const sendAggregatedMetricsToWorker = async (worker: Worker) => {
    const metricsData = await aggregatorRegistry.clusterMetrics()
    const contentType = aggregatorRegistry.contentType
    worker.send({
      cmd: 'receiveAggregatePrometheusMetrics',
      val: {
        metricsData,
        contentType
      }
    })
  }

  // Handle message received from worker to primary
  cluster.on('message', (workerWhoSentMsg, msg) => {
    if (msg?.cmd === 'requestAggregatedPrometheusMetrics') {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      sendAggregatedMetricsToWorker(workerWhoSentMsg)
    }
  })

  // Respawn workers and update each worker's knowledge of who the special worker is.
  // The primary process doesn't need to be respawned because the whole app stops if the primary stops (since the workers are child processes of the primary)
  cluster.on('exit', (worker, code, signal) => {
    logger.info(
      `Worker process with pid=${worker.process.pid} died because ${
        signal || code
      }. Respawning...`
    )
    const newWorker = cluster.fork()
    if (clusterUtils.specialWorkerId === worker.id) {
      logger.info(
        'The worker that died was the special worker. Setting a new special worker...'
      )
      clusterUtils.specialWorkerId = newWorker.id
      for (const worker of Object.values(cluster.workers || {})) {
        worker?.send({ cmd: 'setSpecialWorkerId', val: newWorker.id })
      }
    }
  })

  // do not await this, this should just run in background for now
  // wait one minute before starting this because it might cause init to degrade
  if (config.get('backgroundDiskCleanupCheckEnabled')) {
    setTimeout(() => {
      sweepSubdirectoriesInFiles()
    }, 60_000)
  }
}

// Workers don't share memory, so each one is its own Express instance with its own version of objects like serviceRegistry
const startAppForWorker = async () => {
  debugLogTimer('startAppForWorker')
  if (process.env.isInitWorker) clusterUtils.markThisWorkerAsInit()
  logger.info(
    `Worker process with pid=${process.pid} and worker ID=${
      cluster.worker?.id
    } is running. Is this worker init: ${clusterUtils.isThisWorkerInit()}`
  )
  debugLogTimer('startAppForWorker.verifyConfigAndDb')
  await verifyConfigAndDb()
  debugLogTimer('startAppForWorker.startApp')
  await startApp()

  cluster.worker!.on('message', (msg) => {
    if (msg?.cmd === 'setSpecialWorkerId') {
      clusterUtils.specialWorkerId = msg?.val
    } else if (msg?.cmd === 'receiveAggregatePrometheusMetrics') {
      try {
        const { prometheusRegistry } = serviceRegistry
        prometheusRegistry.resolvePromiseToGetAggregatedMetrics(msg?.val)
      } catch (error: any) {
        logger.error(
          `Failed to send aggregated metrics data back to worker: ${error}`
        )
      }
    }
  })

  if (clusterUtils.isThisWorkerInit() && process.send) {
    process.send({ cmd: 'initComplete' })
  }
}

const startAppWithoutCluster = async () => {
  debugLogTimer('startAppWithoutCluster')
  logger.info(`Starting app with cluster mode disabled`)
  debugLogTimer('startAppWithoutCluster.setupDbAndRedis')
  await setupDbAndRedis()
  debugLogTimer('startAppWithoutCluster.startApp')
  await startApp()
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

if (!clusterUtils.isClusterEnabled()) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  startAppWithoutCluster()
} else if (cluster.isMaster) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  startAppForPrimary()
} else if (cluster.isWorker) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  startAppForWorker()
} else {
  throw new Error("Can't determine if process is primary or worker in cluster")
}

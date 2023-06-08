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

import type { Worker } from 'cluster'
import { AggregatorRegistry } from 'prom-client'
import { clusterUtilsForPrimary } from './utils/cluster/clusterUtilsForPrimary'
import { clusterUtilsForWorker } from './utils/cluster/clusterUtilsForWorker'
import { getNumWorkers, isClusterEnabled } from './utils/cluster/clusterUtils'
import cluster from 'cluster'

import ON_DEATH from 'death'
import { Keypair } from '@solana/web3.js'

import { recordMetrics } from './services/prometheusMonitoring/prometheusUsageUtils'
import { initializeApp } from './app'
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

const runAsyncBackgroundTasks = async () => {
  if (config.get('backgroundDiskCleanupCheckEnabled')) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    sweepSubdirectoriesInFiles()
  }
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

  const numWorkers = getNumWorkers()
  logger.info(`Spawning ${numWorkers} processes to run the Express app...`)
  const firstWorker = cluster.fork({
    isThisWorkerFirst: true,
    isThisWorkerSpecial: true
  })
  clusterUtilsForPrimary.setSpecialWorkerId(firstWorker.id)
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

  // Respawn workers and track which worker is the special worker.
  // The primary process doesn't need to be respawned because the whole app stops if the primary stops (since the workers are child processes of the primary)
  cluster.on('exit', (worker, code, signal) => {
    logger.info(
      `Worker process with pid=${worker.process.pid} died because ${
        signal || code
      }. Respawning...`
    )
    const killedWorkerWasSpecial =
      clusterUtilsForPrimary.getSpecialWorkerId() === worker.id
    const newWorker = cluster.fork({ isSpecialWorker: killedWorkerWasSpecial })
    if (killedWorkerWasSpecial) {
      logger.info(
        'The worker that died was the special worker. Setting a new special worker...'
      )
      clusterUtilsForPrimary.setSpecialWorkerId(newWorker.id)
    }
  })

  // Don't await this - these are recurring tasks that run in the background after
  // a one minute delay to avoid causing init to degrade
  setTimeout(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    runAsyncBackgroundTasks()
  }, 60_000)
}

// Workers don't share memory, so each one is its own Express instance with its own version of objects like serviceRegistry
const startAppForWorker = async () => {
  debugLogTimer('startAppForWorker')
  if (process.env.isThisWorkerFirst === 'true')
    clusterUtilsForWorker.markThisWorkerAsFirst()
  if (process.env.isThisWorkerSpecial === 'true')
    clusterUtilsForWorker.markThisWorkerAsSpecial()

  logger.info(
    `Worker process with pid=${process.pid} and worker ID=${
      cluster.worker?.id
    } is running. Is this worker init: ${clusterUtilsForWorker.isThisWorkerFirst()}`
  )
  debugLogTimer('startAppForWorker.verifyConfigAndDb')
  await verifyConfigAndDb()
  debugLogTimer('startAppForWorker.startApp')
  await startApp()

  cluster.worker!.on('message', (msg) => {
    if (msg?.cmd === 'receiveAggregatePrometheusMetrics') {
      try {
        const { prometheusRegistry } = serviceRegistry
        prometheusRegistry.resolvePromiseToGetAggregatedMetrics(msg?.val)
      } catch (error: any) {
        logger.error(
          `Failed to send aggregated metrics data back to worker: ${error}`
        )
      }
    } else if (msg?.cmd === 'recordMetric') {
      try {
        // The primary can't record prometheus metrics in cluster mode, so we record a metric that the primary sent to this worker if it's the special worker
        if (clusterUtilsForWorker.isThisWorkerSpecial()) {
          recordMetrics(serviceRegistry.prometheusRegistry, logger, [msg.val])
        }
      } catch (error: any) {
        logger.error(
          `Primary requested worker to record a metric, and the worker failed to record it: ${error}`
        )
      }
    }
  })

  if (clusterUtilsForWorker.isThisWorkerFirst() && process.send) {
    process.send({ cmd: 'initComplete' })
  }

  // Ensure health of queues that might've been affected by the special worker dying.
  // The special worker is responsible for re-enqueing jobs when other jobs complete,
  // so if it died then it might have failed to re-enqueue some jobs
  if (clusterUtilsForWorker.isThisWorkerSpecial()) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setInterval(async () => {
      await serviceRegistry.recoverStateMachineQueues()
    }, 90_000)
  }
}

const startAppWithoutCluster = async () => {
  debugLogTimer('startAppWithoutCluster')
  logger.info(`Starting app with cluster mode disabled`)
  debugLogTimer('startAppWithoutCluster.setupDbAndRedis')
  await setupDbAndRedis()
  debugLogTimer('startAppWithoutCluster.startApp')
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

if (!isClusterEnabled()) {
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

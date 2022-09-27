'use strict'

import type { Cluster, Worker } from 'cluster'
import { AggregatorRegistry } from 'prom-client'
import { clusterUtils } from './utils'
const cluster: Cluster = require('cluster')

const { setupTracing } = require('./tracer')
setupTracing('content-node')

const ON_DEATH = require('death')
const EthereumWallet = require('ethereumjs-wallet')
const { Keypair } = require('@solana/web3.js')

const initializeApp = require('./app')
const config = require('./config')
const { sequelize } = require('./models')
const { runMigrations, clearRunningQueries } = require('./migrationManager')
const { logger } = require('./logging')
const { serviceRegistry } = require('./serviceRegistry')
const redisClient = require('./redis')

// This should eventually only be instantiated in the primary and then workers should call setupClusterWorker().
// However, a bug currently requires instantiating this in workers as well:
// https://github.com/siimon/prom-client/issues/501
const aggregatorRegistry = new AggregatorRegistry()

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

// The primary process performs one-time validation and spawns worker processes that each run the Express app
const startAppForPrimary = async () => {
  logger.info(`Primary process with pid=${process.pid} is running`)

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

  const numWorkers = clusterUtils.getNumWorkers()
  logger.info(`Spawning ${numWorkers} processes to run the Express app...`)
  const firstWorker = cluster.fork()
  // Wait for the first worker to perform one-time init logic before spawning other workers
  firstWorker.on('message', (msg) => {
    if (msg?.cmd === 'initComplete') {
      for (let i = 0; i < numWorkers - 1; i++) {
        cluster.fork()
      }
    }
  })

  const sendAggregatedMetricsToWorker = async (worker: Worker) => {
    const metrics = await aggregatorRegistry.clusterMetrics()
    const contentType = aggregatorRegistry.contentType
    worker.send({
      cmd: 'receiveAggregatePrometheusMetrics',
      val: {
        metrics,
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
}

// Workers don't share memory, so each one is its own Express instance with its own version of objects like serviceRegistry
const startAppForWorker = async () => {
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

  logger.info(
    `Worker process with pid=${process.pid} and worker ID=${cluster.worker?.id} is running`
  )

  await verifyConfigAndDb()

  // When app terminates, close down any open DB connections gracefully
  ON_DEATH((signal: any, error: any) => {
    // NOTE: log messages emitted here may be swallowed up if using the bunyan CLI (used by
    // default in `npm start` command). To see messages emitted after a kill signal, do not
    // use the bunyan CLI.
    logger.info('Shutting down db and express app...', signal, error)
    sequelize.close()
    if (appInfo) {
      appInfo.server.close()
    }
  })

  await serviceRegistry.initServices()
  const nodeMode = config.get('devMode') ? 'Dev Mode' : 'Production Mode'
  logger.info(`Initialized services (Node running in ${nodeMode})`)
  serviceRegistry.initServicesAsynchronously()
  const appInfo = initializeApp(getPort(), serviceRegistry)
  logger.info('Initialized app and server')
  await serviceRegistry.initServicesThatRequireServer(appInfo.app)

  cluster.worker!.on('message', (msg) => {
    if (msg?.cmd === 'setSpecialWorkerId') {
      clusterUtils.specialWorkerId = msg?.val
    } else if (msg?.cmd === 'receiveAggregatePrometheusMetrics') {
      const { metrics, contentType } = msg?.val
      const { prometheusRegistry } = serviceRegistry
      prometheusRegistry.setCustomAggregateContentType(contentType)
      prometheusRegistry.setCustomAggregateMetricData(metrics)
    }
  })

  if (clusterUtils.isThisWorkerInit() && process.send) {
    process.send({ cmd: 'initComplete' })
  }
}

if (cluster.isMaster) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  startAppForPrimary()
} else if (cluster.isWorker) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  startAppForWorker()
} else {
  throw new Error("Can't determine if process is primary or worker in cluster")
}

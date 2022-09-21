'use strict'

import type { Cluster } from 'cluster'
import type { CpuInfo } from 'os'
const cluster: Cluster = require('cluster')
const { cpus }: { cpus: () => CpuInfo[] } = require('os')

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

  // This is called `cpus()` but it actually returns the # of logical cores, which is possibly higher than # of physical cores if there's hyperthreading
  const logicalCores = cpus().length
  const numWorkers = config.get('expressAppConcurrency') || logicalCores
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

  cluster.on('exit', (worker, code, signal) => {
    logger.info(
      `Worker process with pid=${worker.process.pid} died because ${
        signal || code
      }. Respawning...`
    )
    cluster.fork()
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

  const nodeMode = config.get('devMode') ? 'Dev Mode' : 'Production Mode'

  await serviceRegistry.initServices()
  logger.info(`Initialized services (Node running in ${nodeMode})`)
  const appInfo = initializeApp(getPort(), serviceRegistry)
  logger.info('Initialized app and server')

  // Make the first worker wait for some services to be fully up before spinning up other workers
  serviceRegistry.initServicesAsynchronously()
  if (cluster.worker?.id === 1) {
    await serviceRegistry.initServicesThatRequireServer(appInfo.app)
  } else {
    serviceRegistry.initServicesThatRequireServer(appInfo.app)
  }

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

  if (cluster.worker?.id === 1 && process.send) {
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

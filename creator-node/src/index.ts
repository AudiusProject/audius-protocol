'use strict'

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
  process.exit(1)
}

const verifyDBConnection = async () => {
  try {
    logger.info('Verifying DB connection...')
    await sequelize.authenticate() // runs SELECT 1+1 AS result to check db connection
    logger.info('DB connected successfully!')
  } catch (connectionError) {
    exitWithError('Error connecting to DB:', connectionError)
  }
}

const runDBMigrations = async () => {
  try {
    logger.info('Executing database migrations...')
    await runMigrations()
    logger.info('Migrations completed successfully')
  } catch (migrationError) {
    exitWithError('Error in migrations:', migrationError)
  }
}

const connectToDBAndRunMigrations = async () => {
  await verifyDBConnection()
  await clearRunningQueries()
  await runDBMigrations()
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

const startApp = async () => {
  logger.info('Configuring service...')

  await config.asyncConfig()

  // fail if delegateOwnerWallet & delegatePrivateKey not present
  const delegateOwnerWallet = config.get('delegateOwnerWallet')
  const delegatePrivateKey = config.get('delegatePrivateKey')
  const creatorNodeEndpoint = config.get('creatorNodeEndpoint')

  if (!delegateOwnerWallet || !delegatePrivateKey || !creatorNodeEndpoint) {
    exitWithError(
      'Cannot startup without delegateOwnerWallet, delegatePrivateKey, and creatorNodeEndpoint'
    )
  }

  // fail if delegateOwnerWallet doesn't derive from delegatePrivateKey
  const privateKeyBuffer = Buffer.from(
    config.get('delegatePrivateKey').replace('0x', ''),
    'hex'
  )
  const walletAddress =
    EthereumWallet.fromPrivateKey(privateKeyBuffer).getAddressString()
  if (walletAddress !== config.get('delegateOwnerWallet').toLowerCase()) {
    throw new Error('Invalid delegatePrivateKey/delegateOwnerWallet pair')
  }

  const trustedNotifierEnabled = !!config.get('trustedNotifierID')
  const nodeOperatorEmailAddress = config.get('nodeOperatorEmailAddress')

  if (!trustedNotifierEnabled && !nodeOperatorEmailAddress) {
    exitWithError(
      'Cannot startup without a trustedNotifierID or nodeOperatorEmailAddress'
    )
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

  await connectToDBAndRunMigrations()

  const nodeMode = config.get('devMode') ? 'Dev Mode' : 'Production Mode'
  await serviceRegistry.initServices()
  logger.info(`Initialized services (Node running in ${nodeMode})`)

  const appInfo = initializeApp(getPort(), serviceRegistry)
  logger.info('Initialized app and server')

  // Clear all redis locks
  try {
    await redisClient.WalletWriteLock.clearWriteLocks()
  } catch (e: any) {
    logger.warn(`Could not clear write locks. Skipping..: ${e.message}`)
  }

  // Initialize services that do not require the server, but do not need to be awaited.
  serviceRegistry.initServicesAsynchronously()

  // Some Services cannot start until server is up. Start them now
  // No need to await on this as this process can take a while and can run in the background
  serviceRegistry.initServicesThatRequireServer(appInfo.app)

  // when app terminates, close down any open DB connections gracefully
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
}
startApp()

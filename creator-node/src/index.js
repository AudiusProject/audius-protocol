'use strict'

const ON_DEATH = require('death')
const EthereumWallet = require('ethereumjs-wallet')

const initializeApp = require('./app')
const config = require('./config')
const { sequelize } = require('./models')
const { runMigrations } = require('./migrationManager')
const { logger } = require('./logging')
const { logIpfsPeerIds } = require('./ipfsClient')
const { serviceRegistry } = require('./serviceRegistry')
const { pinCID } = require('./pinCID')

// this import is never used but we need to import it so heapdumps get taken when we run `kill -USR2 <pid>`
const heapdump = require('heapdump') // eslint-disable-line no-unused-vars

const exitWithError = (...msg) => {
  logger.error(...msg)
  process.exit(1)
}

const runDBMigrations = async () => {
  try {
    logger.info('Executing database migrations...')
    await runMigrations()
    logger.info('Migrations completed successfully')
  } catch (err) {
    exitWithError('Error in migrations: ', err)
  }
}

const getMode = () => {
  const arg = process.argv[2]
  const modes = ['--run-migrations', '--run-app', '--run-all']
  if (!modes.includes(arg)) {
    return '--run-all'
  }
  return arg
}

const startApp = async () => {
  logger.info('Configuring service...')

  await config.asyncConfig()

  // fail if delegateOwnerWallet & delegatePrivateKey not present
  const delegateOwnerWallet = config.get('delegateOwnerWallet')
  const delegatePrivateKey = config.get('delegatePrivateKey')
  const creatorNodeEndpoint = config.get('creatorNodeEndpoint')

  if (!delegateOwnerWallet || !delegatePrivateKey || !creatorNodeEndpoint) {
    exitWithError('Cannot startup without delegateOwnerWallet, delegatePrivateKey, and creatorNodeEndpoint')
  }

  // fail if delegateOwnerWallet doesn't derive from delegatePrivateKey
  const privateKeyBuffer = Buffer.from(config.get('delegatePrivateKey').replace('0x', ''), 'hex')
  const walletAddress = EthereumWallet.fromPrivateKey(privateKeyBuffer).getAddressString()
  if (walletAddress !== config.get('delegateOwnerWallet').toLowerCase()) {
    throw new Error('Invalid delegatePrivateKey/delegateOwnerWallet pair')
  }

  const mode = getMode()
  let appInfo

  if (mode === '--run-migrations') {
    await runDBMigrations()
    process.exit(0)
  } else {
    if (mode === '--run-all') {
      await runDBMigrations()
    }

    await logIpfsPeerIds()

    const nodeMode = config.get('devMode') ? 'Dev Mode' : 'Production Mode'

    await serviceRegistry.initServices()
    logger.info(`Initialized services (Node running in ${nodeMode})`)

    appInfo = initializeApp(config.get('port'), serviceRegistry)
    logger.info('Initialized app and server')

    await pinCID(serviceRegistry.ipfsLatest)

    // Some Services cannot start until server is up. Start them now
    // No need to await on this as this process can take a while and can run in the background
    serviceRegistry.initServicesThatRequireServer()
  }

  // when app terminates, close down any open DB connections gracefully
  ON_DEATH((signal, error) => {
    // NOTE: log messages emitted here may be swallowed up if using the bunyan CLI (used by
    // default in `npm start` command). To see messages emitted after a kill signal, do not
    // use the bunyan CLI.
    logger.info('Shutting down db and express app...', signal, error)
    sequelize.close()
    if (appInfo) { appInfo.server.close() }
  })
}
startApp()

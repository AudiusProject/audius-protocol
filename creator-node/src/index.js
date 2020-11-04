'use strict'

const start = Date.now()
const ON_DEATH = require('death')
const path = require('path')
const EthereumWallet = require('ethereumjs-wallet')

console.log('startup profiling - index.js - about to start requires')
const initializeApp = require('./app')
console.log('startup profiling - index.js - required app', Math.floor((Date.now() - start) / 1000))

const config = require('./config')
console.log('startup profiling - index.js - required config', Math.floor((Date.now() - start) / 1000))

const { sequelize } = require('./models')
console.log('startup profiling - index.js - required sequelize', Math.floor((Date.now() - start) / 1000))

const { runMigrations } = require('./migrationManager')
console.log('startup profiling - index.js - required migrationManager', Math.floor((Date.now() - start) / 1000))

const { logger } = require('./logging')
console.log('startup profiling - index.js - required logging', Math.floor((Date.now() - start) / 1000))

const { logIpfsPeerIds } = require('./ipfsClient')
console.log('startup profiling - index.js - required ipfsClient', Math.floor((Date.now() - start) / 1000))

const { serviceRegistry } = require('./serviceRegistry')
console.log('startup profiling - index.js - required serviceRegistry', Math.floor((Date.now() - start) / 1000))

const exitWithError = (...msg) => {
  logger.error(...msg)
  process.exit(1)
}

const configFileStorage = () => {
  if (!config.get('storagePath')) {
    exitWithError('Must set storagePath to use for content repository.')
  }
  return (path.resolve('./', config.get('storagePath')))
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
  const storagePath = configFileStorage()

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

    console.log('startup profiling - index.js - before serviceManager init', Math.floor((Date.now() - start) / 1000))
    await serviceRegistry.initServices()
    console.log('startup profiling - index.js - after serviceManager init', Math.floor((Date.now() - start) / 1000))
    logger.info('Initialized services!')

    appInfo = initializeApp(config.get('port'), storagePath, serviceRegistry)
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

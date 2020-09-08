'use strict'

const ON_DEATH = require('death')
const path = require('path')

const initializeApp = require('./app')
const config = require('./config')
const { sequelize } = require('./models')
const { runMigrations } = require('./migrationManager')
const { logger } = require('./logging')
const { logIpfsPeerIds } = require('./ipfsClient')
const { serviceRegistry } = require('./serviceRegistry')
const { update } = require('lodash')

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

  // TODO: Throw here as well
  if (!delegateOwnerWallet || !delegatePrivateKey) {
    exitWithError('Cannot startup without delegateOwnerWallet and delegatePrivateKey')
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

    await serviceRegistry.initServices()
    logger.info('Initialized services!')

    let audiusLibs = serviceRegistry.libs
    const spID = config.get('spID')
    const endpoint = config.get('creatorNodeEndpoint')
    if (spID === 0 && audiusLibs) {
      console.log(`Retrieving spID for ${endpoint}`)
      const recoveredSpID = await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint(
        config.get('creatorNodeEndpoint')
      )
      console.log(`Recovered ${recoveredSpID} for ${config.get('creatorNodeEndpoint')}`)
      config.set('spID', recoveredSpID)
    }

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

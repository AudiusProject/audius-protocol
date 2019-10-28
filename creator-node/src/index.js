'use strict'

const ON_DEATH = require('death')
const ipfsClient = require('ipfs-http-client')
const path = require('path')
const AudiusLibs = require('@audius/libs')

const initializeApp = require('./app')
const config = require('./config')
const { sequelize } = require('./models')
const { runMigrations } = require('./migrationManager')
const { logger } = require('./logging')

const initAudiusLibs = async () => {
  const ethWeb3 = await AudiusLibs.Utils.configureWeb3(
    config.get('ethProviderUrl'),
    config.get('ethNetworkId'),
    /* requiresAccount */ false
  )
  const discoveryProviderWhitelist = config.get('discoveryProviderWhitelist')
    ? new Set(config.get('discoveryProviderWhitelist').split(','))
    : null

  const audiusLibs = new AudiusLibs({
    ethWeb3Config: AudiusLibs.configEthWeb3(
      config.get('ethTokenAddress'),
      config.get('ethRegistryAddress'),
      ethWeb3,
      config.get('ethOwnerWallet')
    ),
    discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(true, discoveryProviderWhitelist)
  })
  await audiusLibs.init()
  return audiusLibs
}

const startApp = async () => {
  // configure file storage
  if (!config.get('storagePath')) {
    logger.error('Must set storagePath to use for content repository.')
    process.exit(1)
  }
  const storagePath = path.resolve('./', config.get('storagePath'))

  // run config
  logger.info('Configuring service...')
  config.asyncConfig().then(() => {
    logger.info('Service configured')
  })

  // connect to IPFS
  let ipfsAddr = config.get('ipfsHost')
  if (!ipfsAddr) {
    logger.error('Must set ipfsAddr')
    process.exit(1)
  }
  let ipfs = ipfsClient(ipfsAddr, config.get('ipfsPort'))

  // run all migrations
  logger.info('Executing database migrations...')
  runMigrations().then(async () => {
    logger.info('Migrations completed successfully')
  }).error((err) => {
    logger.error('Error in migrations: ', err)
    process.exit(1)
  })

  const audiusLibs = (config.get('isUserMetadataNode')) ? null : await initAudiusLibs()
  logger.info('Initialized audius libs')

  const appInfo = initializeApp(config.get('port'), storagePath, ipfs, audiusLibs)

  // when app terminates, close down any open DB connections gracefully
  ON_DEATH((signal, error) => {
    // NOTE: log messages emitted here may be swallowed up if using the bunyan CLI (used by
    // default in `npm start` command). To see messages emitted after a kill signal, do not
    // use the bunyan CLI.
    logger.info('Shutting down db and express app...')
    sequelize.close()
    appInfo.server.close()
  })
}

startApp()

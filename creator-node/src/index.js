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
const ContentBlacklister = require('./contentBlacklister')

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

const configFileStorage = () => {
  if (!config.get('storagePath')) {
    logger.error('Must set storagePath to use for content repository.')
    process.exit(1)
  }
  return (path.resolve('./', config.get('storagePath')))
}

const initIPFS = async () => {
  const ipfsAddr = config.get('ipfsHost')
  if (!ipfsAddr) {
    logger.error('Must set ipfsAddr')
    process.exit(1)
  }
  const ipfs = ipfsClient(ipfsAddr, config.get('ipfsPort'))
  const identity = await ipfs.id()
  logger.info(`Current IPFS Peer ID: ${JSON.stringify(identity)}`)
  return ipfs
}

const runDBMigrations = async () => {
  try {
    logger.info('Executing database migrations...')
    await runMigrations()
    logger.info('Migrations completed successfully')
  } catch (err) {
    logger.error('Error in migrations: ', err)
    process.exit(1)
  }
}

const startApp = async () => {
  logger.info('Configuring service...')
  await config.asyncConfig()
  const storagePath = configFileStorage()
  const ipfs = await initIPFS()
  await runDBMigrations()

  // const audiusLibs = (config.get('isUserMetadataNode')) ? null : await initAudiusLibs()
  logger.info('Initialized audius libs')

  const appInfo = initializeApp(config.get('port'), storagePath, ipfs, null)

  ContentBlacklister.blacklist(ipfs)

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

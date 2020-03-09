'use strict'

const ON_DEATH = require('death')
const ipfsClient = require('ipfs-http-client')
const ipfsClientLatest = require('ipfs-http-client-latest')
const path = require('path')
const AudiusLibs = require('@audius/libs')

const initializeApp = require('./app')
const config = require('./config')
const { sequelize } = require('./models')
const { runMigrations } = require('./migrationManager')
const { logger } = require('./logging')
const BlacklistManager = require('./blacklistManager')

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
  const ipfsLatest = ipfsClientLatest({ host: ipfsAddr, port: config.get('ipfsPort'), protocol: 'http' })

  // initialize ipfs here
  const identity = await ipfs.id()
  // Pretty print the JSON obj with no filter fn (e.g. filter by string or number) and spacing of size 2
  logger.info(`Current IPFS Peer ID: ${JSON.stringify(identity, null, 2)}`)

  // init latest version of ipfs
  const identityLatest = await ipfsLatest.id()
  logger.info(`Current IPFS Peer ID (using latest version of ipfs client): ${JSON.stringify(identityLatest, null, 2)}`)

  return { ipfs, ipfsLatest }
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
  const storagePath = configFileStorage()

  const { ipfs, ipfsLatest } = await initIPFS()

  const mode = getMode()
  let appInfo

  if (mode === '--run-migrations') {
    await runDBMigrations()
    process.exit(0)
  } else {
    if (mode === '--run-all') {
      await runDBMigrations()
    }

    /** Run app */
    await BlacklistManager.blacklist(ipfs)

    const audiusLibs = (config.get('isUserMetadataNode')) ? null : await initAudiusLibs()
    logger.info('Initialized audius libs')

    appInfo = initializeApp(config.get('port'), storagePath, ipfs, audiusLibs, BlacklistManager, ipfsLatest)
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

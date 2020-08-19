'use strict'

const ON_DEATH = require('death')
const path = require('path')
const AudiusLibs = require('@audius/libs')
const StateMachine = require('./stateMachine')

const initializeApp = require('./app')
const config = require('./config')
const { sequelize } = require('./models')
const { runMigrations } = require('./migrationManager')
const { logger } = require('./logging')
const BlacklistManager = require('./blacklistManager')
const { ipfs, ipfsLatest, logIpfsPeerIds } = require('./ipfsClient')

const exitWithError = (...msg) => {
  logger.error(...msg)
  process.exit(1)
}

const initAudiusLibs = async () => {
  const ethWeb3 = await AudiusLibs.Utils.configureWeb3(
    config.get('ethProviderUrl'),
    config.get('ethNetworkId'),
    /* requiresAccount */ false
  )
  const dataWeb3 = await AudiusLibs.Utils.configureWeb3(
    config.get('dataProviderUrl'),
    null,
    false
  )
  const discoveryProviderWhitelist = config.get('discoveryProviderWhitelist')
    ? new Set(config.get('discoveryProviderWhitelist').split(','))
    : null
  const identityService = config.get('identityService')

  const audiusLibs = new AudiusLibs({
    ethWeb3Config: AudiusLibs.configEthWeb3(
      config.get('ethTokenAddress'),
      config.get('ethRegistryAddress'),
      ethWeb3,
      config.get('ethOwnerWallet')
    ),
    web3Config: {
      registryAddress: config.get('dataRegistryAddress'),
      useExternalWeb3: true,
      externalWeb3Config: {
        web3: dataWeb3,
        ownerWallet: config.get('delegateOwnerWallet')
      }
    },
    discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(discoveryProviderWhitelist),
    // If an identity service config is present, set up libs with the connection, otherwise do nothing
    identityServiceConfig: identityService ? AudiusLibs.configIdentityService(identityService) : undefined,
    isDebug: config.get('creatorNodeIsDebug')
  })
  await audiusLibs.init()
  return audiusLibs
}

const configFileStorage = () => {
  if (!config.get('storagePath')) {
    exitWithError('Must set storagePath to use for content repository.')
  }
  return (path.resolve('./', config.get('storagePath')))
}

const initUserStateMachine = async (libs) => {
  const userStateMachine = new StateMachine(libs)
  await userStateMachine.init()
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
  const spID = config.get('spID')
  console.log(`spID: ${spID} // typeof ${typeof (spID)}`)
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

    /** Run app */
    await BlacklistManager.blacklist(ipfs)

    const audiusLibs = (config.get('isUserMetadataNode')) ? null : await initAudiusLibs()
    logger.info('Initialized audius libs')

    /** if spID is 0, check if registered on chain and store locally */
    if (spID === 0 && audiusLibs) {
      const recoveredSpID = await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint(
        config.get('creatorNodeEndpoint')
      )
      console.log(`Recovered ${recoveredSpID} for ${config.get('creatorNodeEndpoint')}`)
      config.set('spID', recoveredSpID)
    }

    appInfo = initializeApp(config.get('port'), storagePath, ipfs, audiusLibs, BlacklistManager, ipfsLatest)

    // start recurring sync jobs
    await initUserStateMachine(audiusLibs)
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

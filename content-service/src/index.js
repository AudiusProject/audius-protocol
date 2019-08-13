'use strict'

const ON_DEATH = require('death')
const ipfsHttpClient = require('ipfs-http-client')
const AudiusLibs = require('@audius/libs')
const Web3 = require('web3')

const initializeApp = require('./app')
const ContentReplicator = require('./contentReplicator')
const config = require('./config')
const { sequelize } = require('./models')
const { runMigrations } = require('./migrationManager')
const { logger } = require('./logging')

const initIPFS = () => {
  // connect to IPFS
  let ipfsAddr = config.get('ipfsHost')
  if (!ipfsAddr) {
    logger.error('Must set ipfsAddr')
    process.exit(1)
  }

  let ipfs = ipfsHttpClient(ipfsAddr, config.get('ipfsPort'))
  ipfs.id(function (err, identity) {
    if (err) {
      throw err
    }
    logger.info(`Current IPFS Peer ID: ${JSON.stringify(identity)}`)
  })
  return ipfs
}

const runDBMigrations = async () => {
  try {
    // run all migrations
    logger.info('Executing database migrations...')
    await runMigrations()
    logger.info('Migrations completed successfully')
  } catch (err) {
    logger.error('Error in migrations: ', err)
    process.exit(1)
  }
}

const initAudiusLibs = async () => {
  const registryAddress = config.get('registryAddress')
  const web3ProviderUrl = config.get('web3ProviderUrl')
  const dataWeb3 = new Web3(new Web3.providers.HttpProvider(web3ProviderUrl))

  const ethWeb3 = await AudiusLibs.Utils.configureWeb3(
    config.get('ethProviderUrl'),
    config.get('ethNetworkId'),
    /* requiresAccount */ false
  )

  const ethWeb3Config = AudiusLibs.configEthWeb3(
    config.get('ethTokenAddress'),
    config.get('ethRegistryAddress'),
    ethWeb3,
    config.get('ethOwnerWallet')
  )
  const audiusLibs = new AudiusLibs(
    {
      web3Config: AudiusLibs.configExternalWeb3(registryAddress, dataWeb3),
      ethWeb3Config,
      discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(true)
    }
  )
  await audiusLibs.init()
  return audiusLibs
}

const startApp = async () => {
  const ipfs = initIPFS()
  await runDBMigrations()
  const audiusLibs = await initAudiusLibs()

  const appInfo = initializeApp(config.get('port'), ipfs)

  const contentReplicator = new ContentReplicator(ipfs, audiusLibs)
  contentReplicator.initBootstrapPeers()
  contentReplicator.refreshPeers()
  contentReplicator.start()

  // when app terminates, close down any open DB connections gracefully
  ON_DEATH((signal, error) => {
    // NOTE: log messages emitted here may be swallowed up if using the bunyan CLI (used by
    // default in `npm start` command). To see messages emitted after a kill signal, do not
    // use the bunyan CLI.
    logger.info('Shutting down db and express app...')
    sequelize.close()
    appInfo.server.close()
    contentReplicator.stop()
  })
}

startApp()

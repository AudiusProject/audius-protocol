const redisClient = require('./redis')
const { ipfs, ipfsLatest } = require('./ipfsClient')
const BlacklistManager = require('./blacklistManager')
const MonitoringQueue = require('./monitors/MonitoringQueue')
const { SnapbackSM } = require('./snapbackSM')
const AudiusLibs = require('@audius/libs')
const USRMService = require('./USRMService')
const config = require('./config')

/**
 * `ServiceRegistry` is a container responsible for exposing various
 * services for use throughout CreatorNode.
 *
 * Services:
 *  - `redis`: Redis Client
 *  - `ipfs`: IPFS Client
 *  - `ipfsLatest`: IPFS Client, latest version
 *  - `blackListManager`: responsible for handling blacklisted content
 *  - `audiusLibs`: an instance of Audius Libs
 *
 * `initServices` must be called prior to consuming servies from the registry.
 */
class ServiceRegistry {
  constructor () {
    this.redis = redisClient
    this.ipfs = ipfs
    this.ipfsLatest = ipfsLatest
    this.blacklistManager = BlacklistManager
    this.monitoringQueue = new MonitoringQueue()
    this.nodeConfig = config

    // below properties aren't initialized until 'initServices' is called
    this.audiusLibs = null
    this.snapbackSM = null
    this.USRMService = null
  }

  /**
   * Configure services, init libs.
   */
  async initServices () {
    // Initialize private IPFS gateway counters
    this.redis.set('ipfsGatewayReqs', 0)
    this.redis.set('ipfsStandaloneReqs', 0)

    await this.blacklistManager.init()

    if (!config.get('isUserMetadataNode')) {
      this.audiusLibs = await initAudiusLibs()

      this.snapbackSM = new SnapbackSM(this.audiusLibs)
      await this.snapbackSM.init()
      
      this.USRMService = new USRMService(this.nodeConfig, this.audiusLibs)
    }

    this.monitoringQueue.start()
  }
}

/** Private helper used by ServiceRegistry for initializing libs */
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

/* Export a single instance of the ServiceRegistry. */
const serviceRegistry = new ServiceRegistry()

module.exports = {
  serviceRegistry
}

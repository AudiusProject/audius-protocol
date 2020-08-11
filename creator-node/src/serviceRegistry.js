const redisClient = require('./redis')
const { ipfs, ipfsLatest } = require('./ipfsClient')
const BlacklistManager = require('./blacklistManager')
const AudiusLibs = require('@audius/libs')
const config = require('./config')

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

function ServiceRegistry () {
  this.redis = redisClient
  this.ipfs = ipfs
  this.ipfsLatest = ipfsLatest
  this.blacklistManager = BlacklistManager
  this.audiusLibs = null

  this.initServices = async () => {
    // Initialize private IPFS gateway counters
    this.redis.set('ipfsGatewayReqs', 0)
    this.redis.set('ipfsStandaloneReqs', 0)

    await this.blacklistManager.blacklist(this.ipfs)
    const audiusLibs = (config.get('isUserMetadataNode')) ? null : await initAudiusLibs()
    this.libs = audiusLibs
  }
}

const serviceRegistry = new ServiceRegistry()

module.exports = {
  serviceRegistry
}

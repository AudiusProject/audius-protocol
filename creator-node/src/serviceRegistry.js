const redisClient = require('./redis')
const { ipfs, ipfsLatest } = require('./ipfsClient')
const BlacklistManager = require('./blacklistManager')
const MonitoringQueue = require('./monitors/MonitoringQueue')
const { SnapbackSM } = require('./snapbackSM')
const AudiusLibs = require('@audius/libs')
const config = require('./config')
const URSMRegistrationManager = require('./services/URSMRegistrationManager')
const { logger } = require('./logging')
const utils = require('./utils')

/**
 * `ServiceRegistry` is a container responsible for exposing various
 * services for use throughout CreatorNode.
 *
 * Services:
 *  - `redis`: Redis Client
 *  - `ipfs`: IPFS Client
 *  - `ipfsLatest`: IPFS Client, latest version
 *  - `blackListManager`: responsible for handling blacklisted content
 *  - `libs`: an instance of Audius Libs
 *  - `monitoringQueue`: recurring job to monitor node state & performance metrics
 *  - `nodeConfig`: exposes config object
 *  - `snapbackSM`: SnapbackStateMachine is responsible for recurring sync and reconfig operations
 *  - `URSMRegistrationManager`: registers node on L2 URSM contract, no-ops afterward
 *
 * `initServices` must be called prior to consuming services from the registry.
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
    this.libs = null
    this.snapbackSM = null
    this.URSMRegistrationManager = null
  }

  /**
   * Configure all services
   */
  async initServices () {
    // Initialize private IPFS gateway counters
    this.redis.set('ipfsGatewayReqs', 0)
    this.redis.set('ipfsStandaloneReqs', 0)

    await this.blacklistManager.init()

    if (!config.get('isUserMetadataNode')) {
      this.libs = await this._initAudiusLibs()

      this.URSMRegistrationManager = new URSMRegistrationManager(this.nodeConfig, this.libs)

      // Kick off process to initialize node L1 and L2 identity without awaiting. This process will not complete
      //    until server is up, which happens after serviceRegistry.initServices() is called.
      this._initializeNodeIdentityConfig()

      // Kick off snapback init without awaiting. This process requires spID.
      this._initSnapbackSM()
    }

    this.monitoringQueue.start()
  }

  logInfo (msg) {
    logger.info(`ServiceRegistry || ${msg}`)
  }

  logError (msg) {
    logger.error(`ServiceRegistry ERROR || ${msg}`)
  }

  async _initializeNodeIdentityConfig () {
    await this._recoverNodeL1Identity()
    await this._registerNodeOnL2URSM()
  }

  /**
   * Poll L1 SPFactory for spID, set spID config once recovered.
   */
  async _recoverNodeL1Identity () {
    const endpoint = config.get('creatorNodeEndpoint')

    let attempt = 0
    while (this.nodeConfig.get('spID') === 0) {
      this.logInfo(`Attempting to recover node L1 identity for endpoint ${endpoint} || attempt #${++attempt} ...`)

      try {
        const spID = await this.libs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint(
          endpoint
        )
        this.nodeConfig.set('spID', spID)

        // Swallow any errors during recovery attempt
      } catch (e) {
        this.logError(`RecoverNodeL1Identity Error: ${e}`)
      }

      await utils.timeout(5000, false)
    }

    this.logInfo(`Successfully recovered node L1 identity for endpoint ${endpoint} on attempt #${attempt}. spID =  ${this.nodeConfig.get('spID')}`)
  }

  /**
   * Wait until spID config is set, then attempt to register on L2 URSM with infinite retries
   */
  async _registerNodeOnL2URSM () {
    const retryTimeoutMs = 10000 // 10sec

    // Wait until spID config is set
    while (this.nodeConfig.get('spID') === 0) {
      this.logInfo(`Cannot register node on L2 URSM until L1 identity (spID) is set. Retrying in ${retryTimeoutMs}ms`)
      await utils.timeout(retryTimeoutMs, false)
    }

    // Attempt to register on URSM with infinite retries
    let registered = false
    let attempt = 0
    while (registered === false) {
      this.logInfo(`Attempting to register node on L2 URSM || attempt #${++attempt} ...`)

      try {
        await this.URSMRegistrationManager.run()
        registered = true

        // Swallow any errors during registration attempt
      } catch (e) {
        this.logError(`RegisterNodeOnL2URSM Error: ${e}`)
      }
      // registered = true
      await utils.timeout(retryTimeoutMs, false)
    }

    this.logInfo('URSM Registration completed')
  }

  /**
   * Wait until spID config is set, then initialize SnapbackSM
   */
  async _initSnapbackSM () {  
    const retryTimeoutMs = 10000 // ms

    while (this.nodeConfig.get('spID') === 0) {
      this.logInfo(`Cannot initialize SnapbackSM until L1 identity (spID) is set. Retrying in ${retryTimeoutMs}ms`)
      await utils.timeout(retryTimeoutMs, false)
    }

    let complete = false
    while (complete === false) {
      try {
        this.snapbackSM = new SnapbackSM(this.libs)
        await this.snapbackSM.init()
      } catch (e) {
        this.logError(`_initSnapbackSM Error: ${e}`)
      }

      await utils.timeout(retryTimeoutMs, false)
    }
  }

  /**
   * Creates, initializes, and returns an audiusLibs instance
   */
  async _initAudiusLibs () {
    const ethWeb3 = await AudiusLibs.Utils.configureWeb3(
      config.get('ethProviderUrl'),
      config.get('ethNetworkId'),
      /* requiresAccount */ false
    )
    const dataWeb3 = await AudiusLibs.Utils.configureWeb3(
      config.get('dataProviderUrl'),
      /* chainNetworkId */ null,
      /* requiresAccount */ false
    )

    if (!ethWeb3 || !dataWeb3) {
      throw new Error('Failed to init audiusLibs due to web3 configuration error')
    }

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
      web3Config: AudiusLibs.configInternalWeb3(
        config.get('dataRegistryAddress'),
        [config.get('dataProviderUrl')],
        config.get('delegatePrivateKey').replace('0x', '')
      ),
      discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(discoveryProviderWhitelist),
      // If an identity service config is present, set up libs with the connection, otherwise do nothing
      identityServiceConfig: identityService ? AudiusLibs.configIdentityService(identityService) : undefined,
      isDebug: config.get('creatorNodeIsDebug'),
      isServer: true
    })

    await audiusLibs.init()
    return audiusLibs
  }
}

/*
 * Export a singleton instance of the ServiceRegistry
 */
const serviceRegistry = new ServiceRegistry()

module.exports = {
  serviceRegistry
}

const { createBullBoard } = require('@bull-board/api')
const { BullAdapter } = require('@bull-board/api/bullAdapter')
const { ExpressAdapter } = require('@bull-board/express')

const { libs: AudiusLibs } = require('@audius/sdk')
const redisClient = require('./redis')
const BlacklistManager = require('./blacklistManager')
const { SnapbackSM } = require('./snapbackSM/snapbackSM')
const config = require('./config')
const URSMRegistrationManager = require('./services/URSMRegistrationManager')
const { logger, getStartTime, logInfoWithDuration } = require('./logging')
const utils = require('./utils')
const MonitoringQueue = require('./monitors/MonitoringQueue')
const SyncQueue = require('./services/sync/syncQueue')
const SkippedCIDsRetryQueue = require('./services/sync/skippedCIDsRetryService')
const SessionExpirationQueue = require('./services/SessionExpirationQueue')
const AsyncProcessingQueue = require('./AsyncProcessingQueue')
const TrustedNotifierManager = require('./services/TrustedNotifierManager')
const ImageProcessingQueue = require('./ImageProcessingQueue')
const TranscodingQueue = require('./TranscodingQueue')
const StateMachineManager = require('./services/stateMachineManager')
const PrometheusRegistry = require('./services/prometheusMonitoring/prometheusRegistry')

/**
 * `ServiceRegistry` is a container responsible for exposing various
 * services for use throughout CreatorNode.
 *
 * Services:
 *  - `nodeConfig`: exposes config object
 *  - `redis`: Redis Client
 *  - `blackListManager`: responsible for handling blacklisted content
 *  - `monitoringQueue`: recurring job to monitor node state & performance metrics
 *  - `sessionExpirationQueue`: recurring job to clear expired session tokens from Redis and DB
 *  - `asyncProcessingQueue`: queue that processes jobs asynchronously and adds job responses into redis
 *
 *  - `libs`: an instance of Audius Libs
 *  - `snapbackSM`: SnapbackStateMachine is responsible for recurring sync and reconfig operations
 *  - `URSMRegistrationManager`: registers node on L2 URSM contract, no-ops afterward
 *
 * `initServices` must be called prior to consuming services from the registry.
 */
class ServiceRegistry {
  constructor() {
    this.nodeConfig = config
    this.redis = redisClient
    this.blacklistManager = BlacklistManager
    this.monitoringQueue = new MonitoringQueue()
    this.sessionExpirationQueue = new SessionExpirationQueue()
    this.prometheusRegistry = new PrometheusRegistry()

    // below services are initialized separately in below functions `initServices()` and `initServicesThatRequireServer()`
    this.libs = null
    this.stateMachineManager = null
    this.snapbackSM = null
    this.URSMRegistrationManager = null
    this.syncQueue = null
    this.skippedCIDsRetryQueue = null
    this.trustedNotifierManager = null

    this.servicesInitialized = false
    this.asynchronousServicesInitialized = false
    this.servicesThatRequireServerInitialized = false
  }

  /**
   * Configure all services
   */
  async initServices() {
    // init libs
    this.libs = await this._initAudiusLibs()

    // Transcode handoff requires libs. Set libs in AsyncProcessingQueue after libs init is complete
    this.asyncProcessingQueue = new AsyncProcessingQueue(this.libs)

    this.trustedNotifierManager = new TrustedNotifierManager(config, this.libs)
    // do not await on this, if we cannot fetch the notifier from chain, it will stop the content node from coming up
    this.trustedNotifierManager.init()

    // Intentionally not awaitted
    this.monitoringQueue.start()
    this.sessionExpirationQueue.start()

    this.servicesInitialized = true
  }

  /**
   * These services do not need to be awaited and do not require the server.
   */
  async initServicesAsynchronously() {
    const start = getStartTime()

    // Initialize BlacklistManager. If error occurs, do not continue with app start up.
    try {
      await this.blacklistManager.init()
    } catch (e) {
      this.logError(e.message)
      process.exit(1)
    }

    this.asynchronousServicesInitialized = true

    logInfoWithDuration(
      { logger, startTime: start },
      'ServiceRegistry || Initialized asynchronous services'
    )
  }

  /**
   * Initializes the blacklistManager if it is not already initialized, and then returns it
   * @returns initialized blacklistManager instance
   */
  async getBlacklistManager() {
    if (!this.blacklistManager.initialized) {
      await this.blacklistManager.init()
    }

    return this.blacklistManager
  }

  setupBullMonitoring(
    app,
    stateMonitoringQueue,
    cNodeEndpointToSpIdMapQueue,
    stateReconciliationQueue
  ) {
    this.logInfo('Setting up Bull queue monitoring...')

    const serverAdapter = new ExpressAdapter()
    const { stateMachineQueue, manualSyncQueue, recurringSyncQueue } =
      this.snapbackSM
    const { queue: syncProcessingQueue } = this.syncQueue
    const { queue: asyncProcessingQueue } = this.asyncProcessingQueue
    const { queue: imageProcessingQueue } = ImageProcessingQueue
    const { queue: transcodingQueue } = TranscodingQueue
    const { queue: monitoringQueue } = this.monitoringQueue
    const { queue: sessionExpirationQueue } = this.sessionExpirationQueue
    const { queue: skippedCidsRetryQueue } = this.skippedCIDsRetryQueue

    // Make state machine queues truncate long data (they have jobs with large inputs and outputs)
    const stateMonitoringAdapter = new BullAdapter(stateMonitoringQueue, {
      readOnlyMode: true
    })
    const stateReconciliationAdapter = new BullAdapter(
      stateReconciliationQueue,
      { readOnlyMode: true }
    )

    // These queues have very large inputs and outputs, so we truncate job
    // data and results that are nested >=5 levels or contain strings >=10,000 characters
    stateMonitoringAdapter.setFormatter('data', this.truncateBull.bind(this))
    stateMonitoringAdapter.setFormatter(
      'returnValue',
      this.truncateBull.bind(this)
    )
    stateReconciliationAdapter.setFormatter(
      'data',
      this.truncateBull.bind(this)
    )
    stateReconciliationAdapter.setFormatter(
      'returnValue',
      this.truncateBull.bind(this)
    )

    // Dashboard to view queues at /health/bull endpoint. See https://github.com/felixmosh/bull-board#hello-world
    createBullBoard({
      queues: [
        stateMonitoringAdapter, // stateMonitoringQueue
        stateReconciliationAdapter, // stateReconciliationQueue
        new BullAdapter(cNodeEndpointToSpIdMapQueue, { readOnlyMode: true }),
        new BullAdapter(stateMachineQueue, { readOnlyMode: true }),
        new BullAdapter(manualSyncQueue, { readOnlyMode: true }),
        new BullAdapter(recurringSyncQueue, { readOnlyMode: true }),
        new BullAdapter(syncProcessingQueue, { readOnlyMode: true }),
        new BullAdapter(asyncProcessingQueue, { readOnlyMode: true }),
        new BullAdapter(imageProcessingQueue, { readOnlyMode: true }),
        new BullAdapter(transcodingQueue, { readOnlyMode: true }),
        new BullAdapter(monitoringQueue, { readOnlyMode: true }),
        new BullAdapter(sessionExpirationQueue, { readOnlyMode: true }),
        new BullAdapter(skippedCidsRetryQueue, { readOnlyMode: true })
      ],
      serverAdapter
    })

    serverAdapter.setBasePath('/health/bull')
    app.use('/health/bull', serverAdapter.getRouter())
  }

  /**
   * Truncates large JSON data in Bull Board after any of the following is exceeded:
   * - 7 levels of nesting
   * - 10,000 characters (strings only)
   * - 100 elements (arrays) or 100 keys (objects)
   *
   * Adapted from https://github.com/felixmosh/bull-board/pull/414#issuecomment-1134874761
   *
   * @param {Object} dataToTruncate the data that will be truncated as needed
   * @param {number} [curDepth] the current depth of the object (this function is called recursively)
   * @returns dataToTruncate with the following replacements when the above thresholds are exceeded:
   * - [Truncated string of length <length>]
   * - [Truncated array with <length> elements],
   * - [Truncated object with <length> keys]
   */
  truncateBull(dataToTruncate, curDepth = 0) {
    if (
      typeof dataToTruncate === 'object' &&
      dataToTruncate !== null &&
      dataToTruncate !== undefined
    ) {
      if (curDepth < 7) {
        const newDepth = curDepth + 1
        if (Array.isArray(dataToTruncate)) {
          if (dataToTruncate.length > 100) {
            return `[Truncated array with ${dataToTruncate.length} elements]`
          }
          const truncatedArr = []
          dataToTruncate.forEach((element) => {
            truncatedArr.push(this.truncateBull(element, newDepth))
          })
          return truncatedArr
        }
        const json = Object.assign({}, dataToTruncate)
        Object.entries(dataToTruncate).forEach(([key, value]) => {
          switch (typeof value) {
            case 'string':
              json[key] =
                value.length > 10_000
                  ? `[Truncated string of length ${value.length}]`
                  : value
              break
            case 'object':
              if (Array.isArray(value)) {
                json[key] =
                  value.length > 100
                    ? `[Truncated array with ${value.length} elements]`
                    : this.truncateBull(value, newDepth)
              } else {
                const length = Object.keys(value).length
                json[key] =
                  length > 100
                    ? `[Truncated object with ${length} keys]`
                    : this.truncateBull(value, newDepth)
              }
              break
            default:
              json[key] = value
              break
          }
        })
        return json
      }
      return Array.isArray(dataToTruncate)
        ? `[Truncated array with ${dataToTruncate.length} elements]`
        : `[Truncated object with ${Object.keys(dataToTruncate).length} keys]`
    }
    return dataToTruncate
  }

  /**
   * Some services require the node server to be running in order to initialize. Run those here.
   * Specifically:
   *  - recover node L1 identity (requires node health check from server to return success)
   *  - initialize SnapbackSM service (requires node L1 identity)
   *  - construct SyncQueue (requires node L1 identity)
   *  - register node on L2 URSM contract (requires node L1 identity)
   *  - construct & init SkippedCIDsRetryQueue (requires SyncQueue)
   *  - create bull queue monitoring dashboard, which needs other server-dependent services to be running
   */
  async initServicesThatRequireServer(app) {
    const start = getStartTime()

    // Cannot progress without recovering spID from node's record on L1 ServiceProviderFactory contract
    // Retries indefinitely
    await this._recoverNodeL1Identity()

    // SnapbackSM init (requires L1 identity)
    // Retries indefinitely
    await this._initSnapbackSM()
    this.stateMachineManager = new StateMachineManager()
    const {
      stateMonitoringQueue,
      cNodeEndpointToSpIdMapQueue,
      stateReconciliationQueue
    } = await this.stateMachineManager.init(this.libs, this.prometheusRegistry)

    // SyncQueue construction (requires L1 identity)
    // Note - passes in reference to instance of self (serviceRegistry), a very sub-optimal workaround
    this.syncQueue = new SyncQueue(this.nodeConfig, this.redis, this)

    // L2URSMRegistration (requires L1 identity)
    // Retries indefinitely
    await this._registerNodeOnL2URSM()

    // SkippedCIDsRetryQueue construction + init (requires SyncQueue)
    // Note - passes in reference to instance of self (serviceRegistry), a very sub-optimal workaround
    this.skippedCIDsRetryQueue = new SkippedCIDsRetryQueue(
      this.nodeConfig,
      this.libs,
      this
    )
    await this.skippedCIDsRetryQueue.init()

    try {
      this.setupBullMonitoring(
        app,
        stateMonitoringQueue,
        cNodeEndpointToSpIdMapQueue,
        stateReconciliationQueue
      )
    } catch (e) {
      this.logError(
        `Failed to initialize bull monitoring UI: ${e.message || e}`
      )
    }

    this.servicesThatRequireServerInitialized = true

    logInfoWithDuration(
      { logger, startTime: start },
      'ServiceRegistry || Initialized services that require server'
    )
  }

  logInfo(msg) {
    logger.info(`ServiceRegistry || ${msg}`)
  }

  logError(msg) {
    logger.error(`ServiceRegistry ERROR || ${msg}`)
  }

  /**
   * Poll L1 SPFactory for spID & set spID config once recovered.
   */
  async _recoverNodeL1Identity() {
    const endpoint = config.get('creatorNodeEndpoint')

    const retryTimeoutMs = 5000 // 5sec
    let isInitialized = false
    let attempt = 0
    while (!isInitialized) {
      this.logInfo(
        `Attempting to recover node L1 identity for ${endpoint} on ${retryTimeoutMs}ms interval || attempt #${++attempt} ...`
      )

      try {
        const spID =
          await this.libs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint(
            endpoint
          )

        if (spID !== 0) {
          this.nodeConfig.set('spID', spID)

          isInitialized = true
          // Short circuit earlier instead of waiting for another timeout and loop iteration
          break
        }

        // Swallow any errors during recovery attempt
      } catch (e) {
        this.logError(`RecoverNodeL1Identity Error ${e}`)
      }

      await utils.timeout(retryTimeoutMs, false)
    }

    this.logInfo(
      `Successfully recovered node L1 identity for endpoint ${endpoint} on attempt #${attempt}. spID = ${this.nodeConfig.get(
        'spID'
      )}`
    )
  }

  /**
   * Wait until URSM contract is deployed, then attempt to register on L2 URSM with infinite retries
   * Requires L1 identity
   */
  async _registerNodeOnL2URSM() {
    // Wait until URSM contract has been deployed (for backwards-compatibility)
    let retryTimeoutMs = this.nodeConfig.get('devMode')
      ? 10000 /** 10sec */
      : 600000 /* 10min */

    let isInitialized = false
    while (!isInitialized) {
      this.logInfo(
        `Attempting to init UserReplicaSetManagerClient on ${retryTimeoutMs}ms interval...`
      )
      try {
        await this.libs.contracts.initUserReplicaSetManagerClient(false)

        if (this.libs.contracts.UserReplicaSetManagerClient) {
          isInitialized = true
          // Short circuit earlier instead of waiting for another timeout and loop iteration
          break
        }

        // Swallow any errors in contract client init
      } catch (e) {
        this.logError(`Error initting UserReplicaSetManagerClient ${e}`)
      }

      await utils.timeout(retryTimeoutMs, false)
    }

    this.URSMRegistrationManager = new URSMRegistrationManager(
      this.nodeConfig,
      this.libs
    )

    // Attempt to register on URSM with infinite retries
    isInitialized = false
    let attempt = 0
    retryTimeoutMs = 10000 // 10sec
    while (!isInitialized) {
      this.logInfo(
        `Attempting to register node on L2 URSM on ${retryTimeoutMs}ms interval || attempt #${++attempt} ...`
      )

      try {
        await this.URSMRegistrationManager.run()

        isInitialized = true
        // Short circuit earlier instead of waiting for another timeout and loop iteration
        break

        // Swallow any errors during registration attempt
      } catch (e) {
        this.logError(`RegisterNodeOnL2URSM Error ${e}`)
      }

      await utils.timeout(retryTimeoutMs, false)
    }

    this.logInfo('URSM Registration completed')
  }

  /**
   * Initialize SnapbackSM
   * Requires L1 identity
   */
  async _initSnapbackSM() {
    this.snapbackSM = new SnapbackSM(this.nodeConfig, this.libs)

    let isInitialized = false
    const retryTimeoutMs = 10000 // ms
    while (!isInitialized) {
      try {
        this.logInfo(
          `Attempting to init SnapbackSM on ${retryTimeoutMs}ms interval...`
        )

        await this.snapbackSM.init()

        isInitialized = true
        // Short circuit earlier instead of waiting for another timeout and loop iteration
        break

        // Swallow all init errors
      } catch (e) {
        this.logError(`_initSnapbackSM Error ${e}`)
      }

      await utils.timeout(retryTimeoutMs, false)
    }

    this.logInfo(`SnapbackSM Init completed`)
  }

  /**
   * Creates, initializes, and returns an audiusLibs instance
   *
   * Configures dataWeb3 to be internal to libs, logged in with delegatePrivateKey in order to write chain TX
   */
  async _initAudiusLibs() {
    const ethWeb3 = await AudiusLibs.Utils.configureWeb3(
      config.get('ethProviderUrl'),
      config.get('ethNetworkId'),
      /* requiresAccount */ false
    )
    if (!ethWeb3) {
      throw new Error(
        'Failed to init audiusLibs due to ethWeb3 configuration error'
      )
    }

    const discoveryProviderWhitelist = config.get('discoveryProviderWhitelist')
      ? new Set(config.get('discoveryProviderWhitelist').split(','))
      : null
    const identityService = config.get('identityService')
    const discoveryNodeUnhealthyBlockDiff = config.get(
      'discoveryNodeUnhealthyBlockDiff'
    )

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
        // TODO - formatting this private key here is not ideal
        config.get('delegatePrivateKey').replace('0x', '')
      ),
      discoveryProviderConfig: {
        whitelist: discoveryProviderWhitelist,
        unhealthyBlockDiff: discoveryNodeUnhealthyBlockDiff
      },
      // If an identity service config is present, set up libs with the connection, otherwise do nothing
      identityServiceConfig: identityService
        ? AudiusLibs.configIdentityService(identityService)
        : undefined,
      isDebug: config.get('creatorNodeIsDebug'),
      isServer: true,
      preferHigherPatchForPrimary: true,
      preferHigherPatchForSecondaries: true,
      logger
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

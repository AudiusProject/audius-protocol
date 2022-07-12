const { createBullBoard } = require('@bull-board/api')
const { BullAdapter } = require('@bull-board/api/bullAdapter')
const { ExpressAdapter } = require('@bull-board/express')
const _ = require('lodash')

const { libs: AudiusLibs } = require('@audius/sdk')
const redisClient = require('./redis')
const BlacklistManager = require('./blacklistManager')
const { SnapbackSM } = require('./snapbackSM/snapbackSM')
const config = require('./config')
const URSMRegistrationManager = require('./services/URSMRegistrationManager')
const {
  logger: genericLogger,
  getStartTime,
  logInfoWithDuration
} = require('./logging')
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
 */
class ServiceRegistry {
  constructor() {
    // TODO: this is redundant and we should just rely on the import, but this is too tightly coupled with existing logic
    this.nodeConfig = config

    // Some services are initialized to `null` and will be initialized in helper functions

    this.redis = redisClient // Redis Client
    this.prometheusRegistry = new PrometheusRegistry() // Service that tracks metrics
    this.libs = null // instance of Audius Libs
    this.blacklistManager = BlacklistManager // Service that handles blacklisted content
    this.stateMachineManager = null // Service that manages user states
    this.snapbackSM = null // Responsible for recurring sync and reconfig operations
    this.URSMRegistrationManager = null // Registers node on L2 URSM contract, no-ops afterward
    this.trustedNotifierManager = null // Service that blacklists content on behalf of Content Nodes

    // Queues
    this.monitoringQueue = new MonitoringQueue() // Recurring job to monitor node state & performance metrics
    this.sessionExpirationQueue = new SessionExpirationQueue() // Recurring job to clear expired session tokens from Redis and DB
    this.imageProcessingQueue = ImageProcessingQueue // Resizes all images on Audius
    this.transcodingQueue = TranscodingQueue // Transcodes and segments all tracks
    this.skippedCIDsRetryQueue = null // Retries syncing CIDs that were unable to sync on first try
    this.syncQueue = null // Handles syncing data to users' replica sets
    this.asyncProcessingQueue = null // Handles all jobs that should be performed asynchronously. Currently handles track upload and track hand off
    this.stateMonitoringQueue = null // Handles jobs for finding replica set updates and syncs for one slice of users at a time
    this.cNodeEndpointToSpIdMapQueue = null // Handles jobs for updating CNodeEndpointToSpIdMap
    this.stateReconciliationQueue = null // Handles jobs for issuing sync requests and updating users' replica sets
    this.stateMachineQueue = null // DEPRECATED -- being removed very soon. Handles sync jobs based on user state
    this.manualSyncQueue = null // Handles sync jobs triggered by client actions, e.g. track upload
    this.recurringSyncQueue = null // DEPRECATED -- Handles syncs that occur on a cadence, e.g. every hour

    // Flags that indicate whether categories of services have been initialized
    this.synchronousServicesInitialized = false
    this.asynchronousServicesInitialized = false
    this.servicesThatRequireServerInitialized = false
  }

  /**
   * Configure services that do not require the server and will be initialized synchronously
   */
  async initServices() {
    const start = getStartTime()

    this.libs = await this._initAudiusLibs()

    // Transcode handoff requires libs. Set libs in AsyncProcessingQueue after libs init is complete
    this.asyncProcessingQueue = new AsyncProcessingQueue(this.libs)

    this.synchronousServicesInitialized = true

    logInfoWithDuration(
      { logger: genericLogger, startTime: start },
      'ServiceRegistry || Initialized synchronous services'
    )
  }

  /**
   * These services do not need to be awaited and do not require the server.
   */
  async initServicesAsynchronously() {
    const start = getStartTime()

    // If error occurs in initializing these services, do not continue with app start up.
    try {
      await this.blacklistManager.init()

      this.trustedNotifierManager = new TrustedNotifierManager(
        config,
        this.libs
      )

      await this.trustedNotifierManager.init()

      await this.monitoringQueue.start()
      await this.sessionExpirationQueue.start()
    } catch (e) {
      this.logError(e.message)
      process.exit(1)
    }

    this.asynchronousServicesInitialized = true

    logInfoWithDuration(
      { logger: genericLogger, startTime: start },
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

  _setupBullMonitoring(app) {
    this.logInfo('Setting up Bull queue monitoring...')

    const { queue: syncProcessingQueue } = this.syncQueue
    const { queue: asyncProcessingQueue } = this.asyncProcessingQueue
    const { queue: imageProcessingQueue } = this.imageProcessingQueue
    const { queue: transcodingQueue } = this.transcodingQueue
    const { queue: monitoringQueue } = this.monitoringQueue
    const { queue: sessionExpirationQueue } = this.sessionExpirationQueue
    const { queue: skippedCidsRetryQueue } = this.skippedCIDsRetryQueue

    // Make state machine queues truncate long data (they have jobs with large inputs and outputs)
    const stateMonitoringAdapter = new BullAdapter(this.stateMonitoringQueue, {
      readOnlyMode: true
    })
    const stateReconciliationAdapter = new BullAdapter(
      this.stateReconciliationQueue,
      { readOnlyMode: true }
    )

    // These queues have very large inputs and outputs, so we truncate job
    // data and results that are nested >=5 levels or contain strings >=10,000 characters
    stateMonitoringAdapter.setFormatter('data', this._truncateBull.bind(this))
    stateMonitoringAdapter.setFormatter(
      'returnValue',
      this._truncateBull.bind(this)
    )
    stateReconciliationAdapter.setFormatter(
      'data',
      this._truncateBull.bind(this)
    )
    stateReconciliationAdapter.setFormatter(
      'returnValue',
      this._truncateBull.bind(this)
    )

    // Dashboard to view queues at /health/bull endpoint. See https://github.com/felixmosh/bull-board#hello-world
    const serverAdapter = new ExpressAdapter()
    createBullBoard({
      queues: [
        stateMonitoringAdapter,
        stateReconciliationAdapter,
        new BullAdapter(this.cNodeEndpointToSpIdMapQueue, {
          readOnlyMode: true
        }),
        new BullAdapter(this.stateMachineQueue, { readOnlyMode: true }),
        new BullAdapter(this.manualSyncQueue, { readOnlyMode: true }),
        new BullAdapter(this.recurringSyncQueue, { readOnlyMode: true }),
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

  _setupRouteDurationTracking(app) {
    // Get all routes on Content Node
    const routes = app._router.stack
      .filter((element) => element.route && element.route.path)
      .map((element) => {
        const path = element.route.path
        const method = Object.keys(element.route.methods)[0]

        return { path, method }
      })

    this.prometheusRegistry.addRoutesDurationTracking(routes)
    // add middleware to all routes using app.use() to match on the route + key in metric name

    // in hadndle response, end duration track + status code. see the tracks example

    // tODO: remove the manual duration tracker
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
  _truncateBull(dataToTruncate, curDepth = 0) {
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
            truncatedArr.push(this._truncateBull(element, newDepth))
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
                    : this._truncateBull(value, newDepth)
              } else {
                const length = Object.keys(value).length
                json[key] =
                  length > 100
                    ? `[Truncated object with ${length} keys]`
                    : this._truncateBull(value, newDepth)
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

    // Init StateMachineManager
    this.stateMachineManager = new StateMachineManager()
    const {
      stateMonitoringQueue,
      cNodeEndpointToSpIdMapQueue,
      stateReconciliationQueue
    } = await this.stateMachineManager.init(this.libs, this.prometheusRegistry)
    this.stateMonitoringQueue = stateMonitoringQueue
    this.cNodeEndpointToSpIdMapQueue = cNodeEndpointToSpIdMapQueue
    this.stateReconciliationQueue = stateReconciliationQueue

    // SyncQueue construction (requires L1 identity)
    // Note - passes in reference to instance of self (serviceRegistry), a very sub-optimal workaround
    this.syncQueue = new SyncQueue(config, this.redis, this)

    // L2URSMRegistration (requires L1 identity)
    // Retries indefinitely
    await this._registerNodeOnL2URSM()

    // SkippedCIDsRetryQueue construction + init (requires SyncQueue)
    // Note - passes in reference to instance of self (serviceRegistry), a very sub-optimal workaround
    this.skippedCIDsRetryQueue = new SkippedCIDsRetryQueue(
      config,
      this.libs,
      this
    )
    await this.skippedCIDsRetryQueue.init()

    try {
      this._setupBullMonitoring(app)
    } catch (e) {
      this.logError(
        `Failed to initialize bull monitoring UI: ${e.message || e}. Skipping..`
      )
    }

    try {
      this._setupRouteDurationTracking(app)
    } catch (e) {
      this.logError(
        `Failed to setup general duration tracking for all routes: ${e.message}. Skipping..`
      )
    }

    this.servicesThatRequireServerInitialized = true

    logInfoWithDuration(
      { logger: genericLogger, startTime: start },
      'ServiceRegistry || Initialized services that require server'
    )
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
          config.set('spID', spID)

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
      `Successfully recovered node L1 identity for endpoint ${endpoint} on attempt #${attempt}. spID = ${config.get(
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
    let retryTimeoutMs = config.get('devMode')
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
      config,
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
    this.snapbackSM = new SnapbackSM(config, this.libs)
    const { stateMachineQueue, manualSyncQueue, recurringSyncQueue } =
      this.snapbackSM
    this.stateMachineQueue = stateMachineQueue
    this.manualSyncQueue = manualSyncQueue
    this.recurringSyncQueue = recurringSyncQueue

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
      logger: genericLogger
    })

    await audiusLibs.init()
    return audiusLibs
  }

  logInfo(msg) {
    genericLogger.info(`ServiceRegistry || ${msg}`)
  }

  logError(msg) {
    genericLogger.error(`ServiceRegistry ERROR || ${msg}`)
  }
}

/*
 * Export a singleton instance of the ServiceRegistry
 */
const serviceRegistry = new ServiceRegistry()

module.exports = {
  serviceRegistry
}

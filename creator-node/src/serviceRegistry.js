const _ = require('lodash')
const { createBullBoard } = require('@bull-board/api')
const { BullAdapter } = require('@bull-board/api/bullAdapter')
const { ExpressAdapter } = require('@bull-board/express')

const initAudiusLibs = require('./services/initAudiusLibs')
const redisClient = require('./redis')
const BlacklistManager = require('./blacklistManager')
const {
  logger: genericLogger,
  getStartTime,
  logInfoWithDuration
} = require('./logging')
const utils = require('./utils')
const config = require('./config')
const MonitoringQueue = require('./monitors/MonitoringQueue')
const { SyncQueue } = require('./services/sync/syncQueue')
const SyncImmediateQueue = require('./services/sync/syncImmediateQueue')
const SkippedCIDsRetryQueue = require('./services/sync/skippedCIDsRetryService')
const { AsyncProcessingQueue } = require('./AsyncProcessingQueue')
const { SessionExpirationQueue } = require('./services/SessionExpirationQueue')
const { TrustedNotifierManager } = require('./services/TrustedNotifierManager')
const { ImageProcessingQueue } = require('./ImageProcessingQueue')
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
    this.trustedNotifierManager = null // Service that blacklists content on behalf of Content Nodes

    // Queues
    this.monitoringQueue = null // Recurring job to monitor node state & performance metrics
    this.sessionExpirationQueue = new SessionExpirationQueue() // Recurring job to clear expired session tokens from Redis and DB
    this.imageProcessingQueue = new ImageProcessingQueue() // Resizes all images on Audius
    this.transcodingQueue = TranscodingQueue // Transcodes and segments all tracks
    this.skippedCIDsRetryQueue = null // Retries syncing CIDs that were unable to sync on first try
    this.syncQueue = null // Handles syncing data to users' replica sets
    this.syncImmediateQueue = null // Handles syncing manual immediate jobs
    this.asyncProcessingQueue = null // Handles all jobs that should be performed asynchronously. Currently handles track upload and track hand off
    this.monitorStateQueue = null // Handles jobs for slicing batches of users and gathering data about them
    this.findSyncRequestsQueue = null // Handles jobs for finding sync requests
    this.findReplicaSetUpdatesQueue = null // Handles jobs for finding replica set updates
    this.cNodeEndpointToSpIdMapQueue = null // Handles jobs for updating CNodeEndpointToSpIdMap
    this.manualSyncQueue = null // Handles jobs for issuing a manual sync request
    this.recurringSyncQueue = null // Handles jobs for issuing a recurring sync request
    this.updateReplicaSetQueue = null // Handles jobs for updating a replica set
    this.recoverOrphanedDataQueue = null // Handles jobs for finding+reconciling state on nodes outside of a user's replica set
    this.stateMonitoringManager = null // Handles all the queues for monitoring state of the system
    this.stateReconciliationManager = null // Handles all the queues for reconciliting state of the system

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

    this.libs = await initAudiusLibs({})

    // Transcode handoff requires libs. Set libs in AsyncProcessingQueue after libs init is complete
    this.asyncProcessingQueue = new AsyncProcessingQueue(
      this.libs,
      this.prometheusRegistry
    )

    this.trustedNotifierManager = new TrustedNotifierManager(config, this.libs)

    await this.trustedNotifierManager.init()

    this.synchronousServicesInitialized = true

    this.monitoringQueue = new MonitoringQueue()
    await this.monitoringQueue.init(this.prometheusRegistry)

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
      await this.monitoringQueue.start()
      await this.sessionExpirationQueue.start()
      await this.blacklistManager.init()
    } catch (e) {
      this.logError(e.message)
      // eslint-disable-next-line no-process-exit
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
    const { queue: syncImmediateProcessingQueue } = this.syncImmediateQueue
    const { queue: asyncProcessingQueue } = this.asyncProcessingQueue
    const { queue: imageProcessingQueue } = this.imageProcessingQueue
    const { queue: transcodingQueue } = this.transcodingQueue
    const { queue: monitoringQueue } = this.monitoringQueue
    const { queue: sessionExpirationQueue } = this.sessionExpirationQueue
    const { queue: skippedCidsRetryQueue } = this.skippedCIDsRetryQueue

    // These queues have very large inputs and outputs, so we truncate job
    // data and results that are nested >=5 levels or contain strings >=10,000 characters
    const monitorStateAdapter = new BullAdapter(this.monitorStateQueue, {
      readOnlyMode: true
    })
    const findSyncRequestsAdapter = new BullAdapter(
      this.findSyncRequestsQueue,
      {
        readOnlyMode: true
      }
    )
    const findReplicaSetUpdatesAdapter = new BullAdapter(
      this.findReplicaSetUpdatesQueue,
      {
        readOnlyMode: true
      }
    )
    monitorStateAdapter.setFormatter(
      'returnValue',
      this._truncateBull.bind(this)
    )
    findSyncRequestsAdapter.setFormatter('data', this._truncateBull.bind(this))
    findSyncRequestsAdapter.setFormatter(
      'returnValue',
      this._truncateBull.bind(this)
    )
    findReplicaSetUpdatesAdapter.setFormatter(
      'data',
      this._truncateBull.bind(this)
    )
    findReplicaSetUpdatesAdapter.setFormatter(
      'returnValue',
      this._truncateBull.bind(this)
    )

    // Dashboard to view queues at /health/bull endpoint. See https://github.com/felixmosh/bull-board#hello-world
    const serverAdapter = new ExpressAdapter()
    createBullBoard({
      queues: [
        monitorStateAdapter,
        findSyncRequestsAdapter,
        findReplicaSetUpdatesAdapter,
        new BullAdapter(this.cNodeEndpointToSpIdMapQueue, {
          readOnlyMode: true
        }),
        new BullAdapter(this.manualSyncQueue, { readOnlyMode: true }),
        new BullAdapter(this.recurringSyncQueue, { readOnlyMode: true }),
        new BullAdapter(this.updateReplicaSetQueue, { readOnlyMode: true }),
        new BullAdapter(this.recoverOrphanedDataQueue, { readOnlyMode: true }),
        new BullAdapter(imageProcessingQueue, { readOnlyMode: true }),
        new BullAdapter(syncProcessingQueue, { readOnlyMode: true }),
        new BullAdapter(syncImmediateProcessingQueue, { readOnlyMode: true }),
        new BullAdapter(asyncProcessingQueue, { readOnlyMode: true }),
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
              } else if (_.isEmpty(value)) {
                json[key] = value
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
   *  - construct SyncQueue (requires node L1 identity)
   *  - register node on L2 URSM contract (requires node L1 identity)
   *  - construct & init SkippedCIDsRetryQueue (requires SyncQueue)
   *  - create bull queue monitoring dashboard, which needs other server-dependent services to be running
   *
   * The server will be in read only mode at the beginning of this function. Once the L1 identity
   * has been recovered, it will be in read + write mode
   */
  async initServicesThatRequireServer(app) {
    const start = getStartTime()

    // Cannot progress without recovering spID from node's record on L1 ServiceProviderFactory contract
    // because some queues and write routes depend on spID
    // Retries indefinitely
    await this._recoverNodeL1Identity()

    // Init StateMachineManager
    this.stateMachineManager = new StateMachineManager()
    const {
      monitorStateQueue,
      findSyncRequestsQueue,
      findReplicaSetUpdatesQueue,
      cNodeEndpointToSpIdMapQueue,
      manualSyncQueue,
      recurringSyncQueue,
      updateReplicaSetQueue,
      recoverOrphanedDataQueue,
      stateMonitoringManager,
      stateReconciliationManager
    } = await this.stateMachineManager.init(this.libs, this.prometheusRegistry)
    this.monitorStateQueue = monitorStateQueue
    this.findSyncRequestsQueue = findSyncRequestsQueue
    this.findReplicaSetUpdatesQueue = findReplicaSetUpdatesQueue
    this.cNodeEndpointToSpIdMapQueue = cNodeEndpointToSpIdMapQueue
    this.manualSyncQueue = manualSyncQueue
    this.recurringSyncQueue = recurringSyncQueue
    this.updateReplicaSetQueue = updateReplicaSetQueue
    this.recoverOrphanedDataQueue = recoverOrphanedDataQueue
    this.stateMonitoringManager = stateMonitoringManager
    this.stateReconciliationManager = stateReconciliationManager

    // SyncQueue construction (requires L1 identity)
    // Note - passes in reference to instance of self (serviceRegistry), a very sub-optimal workaround
    this.syncQueue = new SyncQueue()
    await this.syncQueue.init(config, this.redis, this)
    this.syncImmediateQueue = new SyncImmediateQueue()
    await this.syncImmediateQueue.init(config, this.redis, this)

    // SkippedCIDsRetryQueue construction + init (requires SyncQueue)
    // Note - passes in reference to instance of self (serviceRegistry), a very sub-optimal workaround
    this.skippedCIDsRetryQueue = new SkippedCIDsRetryQueue(config, this.libs)
    await this.skippedCIDsRetryQueue.init()

    try {
      this._setupBullMonitoring(app)
    } catch (e) {
      this.logError(
        `Failed to initialize bull monitoring UI: ${e.message || e}. Skipping..`
      )
    }

    this.servicesThatRequireServerInitialized = true

    logInfoWithDuration(
      { logger: genericLogger, startTime: start },
      'ServiceRegistry || Initialized services that require server'
    )
  }

  /**
   * Checks for queues that are missing a job and adds a job to them.
   * Some queues run on a cron and should always have 1 job either active or delayed.
   */
  async recoverStateMachineQueues() {
    if (await this._isQueueEmpty(this.cNodeEndpointToSpIdMapQueue)) {
      this.logError('cNodeEndpointToSpIdMapQueue was empty - restarting it')
      await this.stateMonitoringManager.startEndpointToSpIdMapQueue(
        this.cNodeEndpointToSpIdMapQueue
      )
    }
    if (await this._isQueueEmpty(this.monitorStateQueue)) {
      this.logError('monitorStateQueue was empty - restarting it')
      await this.stateMonitoringManager.startMonitorStateQueue(
        this.monitorStateQueue,
        this.libs.discoveryProvider.discoveryProviderEndpoint
      )
    }
    if (await this._isQueueEmpty(this.recoverOrphanedDataQueue)) {
      this.logError('recoverOrphanedDataQueue was empty - restarting it')
      await this.stateReconciliationManager.startRecoverOrphanedDataQueue(
        this.recoverOrphanedDataQueue,
        this.libs.discoveryProvider.discoveryProviderEndpoint
      )
    }
  }

  async _isQueueEmpty(queue) {
    const activeAndDelayedJobs = await queue.getJobs(['active', 'delayed'])
    return !activeAndDelayedJobs?.length
  }

  /**
   * Poll L1 SPFactory for spID & set spID config once recovered.
   */
  async _recoverNodeL1Identity() {
    if (!config.get('creatorNodeEndpoint')?.startsWith('http')) {
      config.set(
        'creatorNodeEndpoint',
        'https://' + config.get('creatorNodeEndpoint')
      )
    }
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

  logInfo(msg) {
    genericLogger.info(`ServiceRegistry || ${msg}`)
  }

  logError(msg) {
    genericLogger.error(`ServiceRegistry ERROR || ${msg}`)
  }
}

//  Export a singleton instance of the ServiceRegistry
module.exports = {
  serviceRegistry: new ServiceRegistry()
}

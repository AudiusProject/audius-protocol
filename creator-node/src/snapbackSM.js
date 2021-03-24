const Bull = require('bull')
const axios = require('axios')

const utils = require('./utils')
const models = require('./models')
const { logger } = require('./logging')

/**
 * Represents the maximum number of syncs that can be issued at once
 * @notice ManualSyncQueue and RecurringSyncQueue will each have this concurrency,
 *    meaning that total max sync job concurrency = (2 * MaxParallelSyncJobs)
 */
const MaxParallelSyncJobs = 7

// Maximum number of time to wait for a sync operation, 6 minutes by default
const MaxSyncMonitoringDurationInMs = 360000

// Retry delay between requests during monitoring
const SyncMonitoringRetryDelay = 15000

// Base value used to filter users over a 24 hour period
const ModuloBase = 24

// For local dev, configure this to be the interval when SnapbackSM is fired
const DevDelayInMS = 3000

// Delay 1 hour between production state machine jobs
const ProductionJobDelayInMs = 3600000

// Describes the type of sync operation
const SyncType = Object.freeze({
  Recurring: 'RECURRING' /** scheduled background sync to keep secondaries up to date */,
  Manual: 'MANUAL' /** triggered by a user data write to primary */
})

/*
  SnapbackSM aka Snapback StateMachine
  Ensures file availability through recurring sync operations
  Pending: User replica set management
*/
class SnapbackSM {
  constructor (nodeConfig, audiusLibs) {
    this.nodeConfig = nodeConfig
    this.audiusLibs = audiusLibs

    // Toggle to switch logs
    this.debug = true

    this.endpoint = this.nodeConfig.get('creatorNodeEndpoint')
    this.spID = this.nodeConfig.get('spID')
    this.snapbackDevModeEnabled = this.nodeConfig.get('snapbackDevModeEnabled')

    // Throw an error if running as creator node and no libs are provided
    if (!this.nodeConfig.get('isUserMetadataNode') && (!this.audiusLibs || !this.spID || !this.endpoint)) {
      throw new Error('Missing required configs - cannot start')
    }

    // State machine queue processes all user operations
    this.stateMachineQueue = this.createBullQueue('state-machine')

    // Sync queues handle issuing sync request from primary -> secondary
    this.manualSyncQueue = this.createBullQueue('manual-sync-queue')
    this.recurringSyncQueue = this.createBullQueue('recurring-sync-queue')

    // Incremented as users are processed
    this.currentModuloSlice = this.randomStartingSlice()
  }

  /**
   * Initialize StateMachine processing:
   * - StateMachineQueue -> determines all system state changes required
   * - SyncQueue -> triggers syncs on secondaries
   *
   * @param maxParallelSyncJobs - Optionally accepts `maxParallelSyncJobs` to override sync concurrency limit `MaxParallelSyncJobs`
   */
  async init (maxParallelSyncJobs = MaxParallelSyncJobs) {
    // Empty all queues to minimize memory consumption
    await this.stateMachineQueue.empty()
    await this.manualSyncQueue.empty()
    await this.recurringSyncQueue.empty()

    // SyncDeDuplicator ensure a sync for a (syncType, userWallet, secondaryEndpoint) tuple is only enqueued once
    this.syncDeDuplicator = new SyncDeDuplicator()

    const isUserMetadata = this.nodeConfig.get('isUserMetadataNode')
    if (isUserMetadata) {
      this.log(`SnapbackSM disabled for userMetadataNode. ${this.endpoint}, isUserMetadata=${isUserMetadata}`)
      return
    }

    /**
     * Initialize stateMachineQueue job processor
     *  - is responsible for adding jobs to sync queue
     *  - processes jobs at recurring interval
     */
    this.stateMachineQueue.process(
      async (job, done) => {
        try {
          await this.processStateMachineOperation()
        } catch (e) {
          this.log(`StateMachineQueue error processing ${e}`)
        } finally {
          const stateMachineJobInterval = (this.nodeConfig.get('snapbackDevModeEnabled')) ? DevDelayInMS : ProductionJobDelayInMs

          this.log(`StateMachineQueue (snapbackDevModeEnabled = ${this.snapbackDevModeEnabled}) || Triggering next job in ${stateMachineJobInterval}`)
          await utils.timeout(stateMachineJobInterval)

          await this.stateMachineQueue.add({ starttime: Date.now() })
          done()
        }
      }
    )

    /**
     * Initialize manualSyncQueue job processor
     *  - will trigger sync to secondary per job config
     */
    this.manualSyncQueue.process(
      maxParallelSyncJobs /* max concurrency */,
      async (job, done) => {
        try {
          await this.processSyncOperation(job, SyncType.Manual)
        } catch (e) {
          this.log(`ManualSyncQueue processing error: ${e}`)
        }

        done()
      }
    )

    /**
     * Initialize recurringSyncQueue job processor
     *  - will trigger sync to secondary per job config
     */
    this.recurringSyncQueue.process(
      maxParallelSyncJobs /* max concurrency */,
      async (job, done) => {
        try {
          await this.processSyncOperation(job, SyncType.Recurring)
        } catch (e) {
          this.log(`RecurringSyncQueue processing error ${e}`)
        }

        done()
      }
    )

    // Enqueue first state machine operation
    await this.stateMachineQueue.add({ startTime: Date.now() })
  }

  // Class level log output
  log (msg) {
    logger.info(`SnapbackSM: ${msg}`)
  }

  // Initialize queue object with provided name and unix timestamp
  createBullQueue (queueName) {
    return new Bull(
      `${queueName}-${Date.now()}`,
      {
        redis: {
          port: this.nodeConfig.get('redisPort'),
          host: this.nodeConfig.get('redisHost')
        },
        defaultJobOptions: {
          // removeOnComplete is required since the completed jobs data set will grow infinitely until memory exhaustion
          removeOnComplete: true,
          removeOnFail: true
        }
      }
    )
  }

  // Randomly select an initial slice
  randomStartingSlice () {
    let slice = Math.floor(Math.random() * Math.floor(ModuloBase))
    this.log(`Starting at data slice ${slice}/${ModuloBase}`)
    return slice
  }

  // Helper function to retrieve all relevant configs
  async getSPInfo () {
    const spID = this.nodeConfig.get('spID')
    const endpoint = this.endpoint
    const delegateOwnerWallet = this.nodeConfig.get('delegateOwnerWallet')
    const delegatePrivateKey = this.nodeConfig.get('delegatePrivateKey')
    return {
      spID,
      endpoint,
      delegateOwnerWallet,
      delegatePrivateKey
    }
  }

  // Retrieve users with this node as primary
  async getNodePrimaryUsers () {
    const currentlySelectedDiscProv = this.audiusLibs.discoveryProvider.discoveryProviderEndpoint
    if (!currentlySelectedDiscProv) {
      // Re-initialize if no discovery provider has been selected
      throw new Error('No discovery provider currently selected, exiting')
    }

    let requestParams = {
      method: 'get',
      baseURL: currentlySelectedDiscProv,
      url: `users/creator_node`,
      params: {
        creator_node_endpoint: this.endpoint
      }
    }
    let resp = await axios(requestParams)
    this.log(`Discovery provider: ${currentlySelectedDiscProv}`)
    return resp.data.data
  }

  /**
   * Given wallets array, queries DB and returns a map of all users with
   *    those wallets and their clock values
   *
   * @dev - TODO what happens if this DB call fails?
   */
  async getUserPrimaryClockValues (wallets) {
    // Query DB for all cnodeUsers with walletPublicKey in `wallets` arg array
    const cnodeUsers = await models.CNodeUser.findAll({
      where: {
        walletPublicKey: {
          [models.Sequelize.Op.in]: wallets
        }
      }
    })

    // Convert cnodeUsers array to map (wallet => clock)
    const cnodeUserClockValuesMap = cnodeUsers.reduce((o, k) => {
      o[k.walletPublicKey] = k.clock
      return o
    }, {})

    return cnodeUserClockValuesMap
  }

  /**
   * Enqueues a sync request to manualSyncQueue & returns job info
   */
  async enqueueManualSync ({
    userWallet,
    primaryEndpoint,
    secondaryEndpoint
  }) {
    try {
      const jobInfo = await this._enqueueSync({
        userWallet,
        primaryEndpoint,
        secondaryEndpoint,
        syncType: SyncType.Manual
      })
      return jobInfo
    } catch (e) {
      logger.error(`Error enqueing manual sync for user: ${userWallet}, error: ${e.message}`)
    }
  }

  /**
   * Enqueues a sync request to manualSyncQueue & returns job info
   *
   * Accepts `primaryClockValue` as param since Snapback pre-computes this before enqueuing
   */
  async enqueueRecurringSync ({
    userWallet,
    primaryEndpoint,
    secondaryEndpoint
  }) {
    try {
      const jobInfo = await this._enqueueSync({
        userWallet,
        primaryEndpoint,
        secondaryEndpoint,
        syncType: SyncType.Recurring
      })

      return jobInfo
    } catch (e) {
      logger.error(`Error enqueing manual sync for user: ${userWallet}, error: ${e.message}`)
    }
  }

  /**
   * Internal function to enqueue a sync request to secondary; returns job info
   *
   * @dev NOTE avoid using bull priority if possible as it significantly reduces performance
   * @dev TODO no need to accept `primaryEndpoint` as param, it always equals `this.endpoint`
   */
  async _enqueueSync ({
    userWallet,
    primaryEndpoint,
    secondaryEndpoint,
    syncType
  }) {
    const queue = (syncType === SyncType.Manual) ? this.manualSyncQueue : this.recurringSyncQueue

    // If duplicate sync already exists, do not add and instead return existing sync job info
    const duplicateSyncJobInfo = this.syncDeDuplicator.getDuplicateSyncJobInfo(syncType, userWallet, secondaryEndpoint)
    if (duplicateSyncJobInfo) {
      this.log(`_enqueueSync Failure - a sync of type ${syncType} is already waiting for user wallet ${userWallet} against secondary ${secondaryEndpoint}`)

      return duplicateSyncJobInfo
    }

    // Define axios params for sync request to secondary
    const syncRequestParameters = {
      baseURL: secondaryEndpoint,
      url: '/sync',
      method: 'post',
      data: {
        wallet: [userWallet],
        creator_node_endpoint: primaryEndpoint,
        // Note - `sync_type` param is only used for logging by nodeSync.js
        sync_type: syncType
      }
    }

    // Add job to manualSyncQueue or recurringSyncQueue based on `syncType` param
    const jobProps = {
      syncRequestParameters,
      startTime: Date.now()
    }

    const jobInfo = await queue.add(jobProps)

    // Record sync in syncDeDuplicator
    this.syncDeDuplicator.recordSync(syncType, userWallet, secondaryEndpoint, jobInfo)

    return jobInfo
  }

  /**
   * Main state machine processing function
   *
   * Determines which users need to be processed and enqueues syncs to secondaries
   */
  async processStateMachineOperation () {
    this.log(`------------------Process SnapbackSM Operation, slice ${this.currentModuloSlice}------------------`)
    if (this.audiusLibs == null) {
      logger.error(`Invalid libs instance`)
      return
    }

    // Retrieve users list for this node
    let usersList = await this.getNodePrimaryUsers()

    // Generate list of wallets by node to query clock number
    // Structured as { nodeEndpoint: [wallet1, wallet2, ...] }
    let nodeVectorClockQueryList = {}

    // Users actually selected to process
    let usersToProcess = []

    // Wallets being processed in this state machine operation
    let wallets = []

    /**
     * Build map of content node to list of all users that need to be processed
     * Determines user list by checking if user_id % moduloBase = currentModuloSlice
     */
    usersList.forEach(
      (user) => {
        // determine if user should be processed by checking if user_id % moduloBase = currentModuloSlice
        const userId = user.user_id
        const modResult = userId % ModuloBase
        const shouldProcess = (modResult === this.currentModuloSlice)
        if (!shouldProcess) {
          return
        }

        // Add to list of currently processing users
        usersToProcess.push(user)
        const userWallet = user.wallet
        wallets.push(userWallet)

        // Conditionally asign secondary if present
        const secondary1 = (user.secondary1) ? user.secondary1 : null
        const secondary2 = (user.secondary2) ? user.secondary2 : null

        // Initialize empty array for node in node-wallet map if needed
        if (!nodeVectorClockQueryList[secondary1] && secondary1 != null) { nodeVectorClockQueryList[secondary1] = [] }
        if (!nodeVectorClockQueryList[secondary2] && secondary2 != null) { nodeVectorClockQueryList[secondary2] = [] }

        // Push wallet if necessary onto secondary wallet list
        if (secondary1 != null) nodeVectorClockQueryList[secondary1].push(userWallet)
        if (secondary2 != null) nodeVectorClockQueryList[secondary2].push(userWallet)
      }
    )

    this.log(`Processing ${usersToProcess.length} users`)
    // Cached primary clock values for currently processing user set
    let primaryClockValues = await this.getUserPrimaryClockValues(wallets)
    // Process nodeVectorClockQueryList and cache user clock values on each node
    let secondaryNodesToProcess = Object.keys(nodeVectorClockQueryList)
    let secondaryNodeUserClockStatus = {}
    await Promise.all(
      secondaryNodesToProcess.map(
        async (node) => {
          secondaryNodeUserClockStatus[node] = {}
          let walletsToQuery = nodeVectorClockQueryList[node]
          let requestParams = {
            baseURL: node,
            method: 'post',
            url: '/users/batch_clock_status',
            data: {
              'walletPublicKeys': walletsToQuery
            }
          }
          this.log(`Requesting ${walletsToQuery.length} users from ${node}`)
          let { data: body } = await axios(requestParams)
          let userClockStatusList = body.data.users
          // Process returned clock values from this secondary node
          userClockStatusList.map(
            (entry) => {
              try {
                secondaryNodeUserClockStatus[node][entry.walletPublicKey] = entry.clock
              } catch (e) {
                this.log(`ERROR updating secondaryNodeUserClockStatus for ${entry.walletPublicKey} with ${entry.clock}`)
                this.log(JSON.stringify(secondaryNodeUserClockStatus))
                throw e
              }
            }
          )
        }
      )
    )
    this.log(`Finished node user clock status querying, moving to sync calculation. Modulo slice ${this.currentModuloSlice}`)

    // Issue syncs if necessary
    // For each user in the initially returned usersList,
    //  compare local primary clock value to value from secondary retrieved in bulk above
    let numSyncsIssued = 0
    await Promise.all(
      usersToProcess.map(
        async (user) => {
          try {
            let userWallet = null
            let secondary1 = null
            let secondary2 = null

            if (user.wallet) userWallet = user.wallet
            if (user.secondary1) secondary1 = user.secondary1
            if (user.secondary2) secondary2 = user.secondary2

            let primaryClockValue = primaryClockValues[userWallet]
            let secondary1ClockValue = secondary1 != null ? secondaryNodeUserClockStatus[secondary1][userWallet] : undefined
            let secondary2ClockValue = secondary2 != null ? secondaryNodeUserClockStatus[secondary2][userWallet] : undefined
            let secondary1SyncRequired = (secondary1ClockValue === undefined) ? true : (primaryClockValue > secondary1ClockValue)
            let secondary2SyncRequired = (secondary2ClockValue === undefined) ? true : (primaryClockValue > secondary2ClockValue)
            this.log(`${userWallet} primaryClock=${primaryClockValue}, (secondary1=${secondary1}, clock=${secondary1ClockValue} syncRequired=${secondary1SyncRequired}), (secondary2=${secondary2}, clock=${secondary2ClockValue}, syncRequired=${secondary2SyncRequired})`)

            // Enqueue sync for secondary1 if required
            if (secondary1SyncRequired && secondary1 != null) {
              await this.enqueueRecurringSync({
                userWallet,
                secondaryEndpoint: secondary1,
                primaryEndpoint: this.endpoint
              })

              numSyncsIssued += 1
            }

            // Enqueue sync for secondary2 if required
            if (secondary2SyncRequired && secondary2 != null) {
              await this.enqueueRecurringSync({
                userWallet,
                secondaryEndpoint: secondary2,
                primaryEndpoint: this.endpoint
              })

              numSyncsIssued += 1
            }
          } catch (e) {
            this.log(`Caught error for user ${user.wallet}, ${JSON.stringify(user)}, ${e.message}`)
          }
        }
      )
    )

    // Increment and adjust current slice by ModuloBase
    const previousModuloSlice = this.currentModuloSlice
    this.currentModuloSlice += 1
    this.currentModuloSlice = this.currentModuloSlice % ModuloBase
    this.log(`Updated modulo slice from ${previousModuloSlice} to ${this.currentModuloSlice} out of ${ModuloBase}`)

    this.log(`Issued ${numSyncsIssued} sync ops`)
    this.log(`------------------END Process SnapbackSM Operation, slice ${previousModuloSlice} / ${ModuloBase} ------------------`)
  }

  /**
   * Track an ongoing sync operation for a given secondaryUrl and user wallet
   *  - Will re-enqueue sync if it fails or is still behind after retries or max duration
   */
  async monitorSecondarySync (userWallet, primaryClockValue, secondaryUrl, syncType) {
    const startTime = Date.now()

    // Define axios request object for secondary sync status request
    const syncMonitoringRequestParameters = {
      method: 'get',
      baseURL: secondaryUrl,
      url: `/sync_status/${userWallet}`,
      responseType: 'json'
    }

    // TODO syncAttemptCompleted does nothing - refactor this
    let syncAttemptCompleted = false
    let secondaryClockValAfterSync = null
    while (!syncAttemptCompleted) {
      try {
        const syncMonitoringResp = await axios(syncMonitoringRequestParameters)

        const respData = syncMonitoringResp.data.data
        this.log(`processSync ${userWallet} secondary response: ${JSON.stringify(respData)}`)

        // A success response does not necessarily guarantee completion, validate response data to confirm
        // Returned secondaryClockValue can be greater than the cached primaryClockValue if a client write was initiated
        //    after primaryClockValue cached and resulting sync is monitored
        if (respData.clockValue >= primaryClockValue) {
          secondaryClockValAfterSync = respData.clockValue

          this.log(`Sync for ${userWallet} at ${secondaryUrl} to clock value ${secondaryClockValAfterSync} for primaryClockVal ${primaryClockValue} completed in ${Date.now() - startTime}ms`)
          syncAttemptCompleted = true
          break
        }
      } catch (e) {
        this.log(`processSync ${userWallet} error querying sync_status: ${e}`)
      }

      // Stop retrying if max sync monitoring duration exceeded
      if (Date.now() - startTime > MaxSyncMonitoringDurationInMs) {
        this.log(`ERROR: processSync ${userWallet} timed out`)
        syncAttemptCompleted = true
        break
      }

      // Delay between retries
      await utils.timeout(SyncMonitoringRetryDelay)
    }

    // enqueue another sync if secondary is still behind
    // TODO max retry limit
    if (!secondaryClockValAfterSync || secondaryClockValAfterSync < primaryClockValue) {
      if (syncType === SyncType.Manual) {
        await this.enqueueManualSync({
          userWallet,
          primaryEndpoint: this.endpoint,
          secondaryEndpoint: secondaryUrl
        })
      } else {
        await this.enqueueRecurringSync({
          userWallet,
          primaryEndpoint: this.endpoint,
          secondaryEndpoint: secondaryUrl
        })
      }
    }
  }

  /**
   * Processes job as it is picked off the queue
   *  - Handles sync jobs for manualSyncQueue and recurringSyncQueue
   *  - Given job data, triggers sync request to secondary and polls until sync completion
   *
   * @param job instance of Bull queue job
   */
  async processSyncOperation (job, syncType) {
    const { id } = job
    const { syncRequestParameters } = job.data

    const isValidSyncJobData = (
      ('baseURL' in syncRequestParameters) &&
      ('url' in syncRequestParameters) &&
      ('method' in syncRequestParameters) &&
      ('data' in syncRequestParameters)
    )
    if (!isValidSyncJobData) {
      logger.error(`Invalid sync data found`, job.data)
      return
    }

    const userWallet = syncRequestParameters.data.wallet[0]
    const secondaryEndpoint = syncRequestParameters.baseURL

    /**
     * Remove sync from syncDeDuplicator once it moves to Active status, before processing
     * It is ok for two identical syncs to be present in Active and Waiting, just not two in Waiting
     */
    this.syncDeDuplicator.removeSync(syncType, userWallet, secondaryEndpoint)

    // primaryClockValue is used in monitorSecondarySync call below
    const primaryClockValue = (await this.getUserPrimaryClockValues([userWallet]))[userWallet]

    this.log(`------------------Process SYNC | User ${userWallet} | Secondary: ${secondaryEndpoint} | Primary clock value ${primaryClockValue} | type: ${syncType} | jobID: ${id} ------------------`)

    // Issue sync request to secondary
    await axios(syncRequestParameters)

    // Wait until has sync has completed (up to a timeout) before moving on
    await this.monitorSecondarySync(userWallet, primaryClockValue, secondaryEndpoint, syncType)

    // Exit when sync status is computed
    this.log(`------------------END Process SYNC | jobID: ${id}------------------`)
  }

  /**
   * Returns all jobs from manualSyncQueue and recurringSyncQueue, keyed by status
   *
   * @dev TODO for some reason completed jobs list is empty, but would be good to
   *    return the list in a verbose mode for debugging + completedCount
   */
  async getSyncQueueJobs () {
    const [
      manualWaiting,
      manualActive,
      recurringWaiting,
      recurringActive
    ] = await Promise.all([
      this.manualSyncQueue.getJobs(['waiting']),
      this.manualSyncQueue.getJobs(['active']),
      this.recurringSyncQueue.getJobs(['waiting']),
      this.recurringSyncQueue.getJobs(['active'])
    ])

    return {
      manualWaiting,
      manualActive,
      recurringWaiting,
      recurringActive
    }
  }
}

/**
 * Ensure a sync for (syncType, userWallet, secondaryEndpoint) can only be enqueued once
 * This is used to ensure multiple concurrent sync tasks are not being redundantly used on a single user
 * Implemented with an in-memory map of string(syncType, userWallet, secondaryEndpoint) -> object(syncJobInfo)
 *
 * @dev We maintain this map to maximize query performance; Bull does not provide any api for querying
 *    jobs by property and would require a linear iteration over the full job list
 */
class SyncDeDuplicator {
  constructor () {
    this.waitingSyncsByUserWalletMap = {}
  }

  /** Stringify properties to enable storage with a flat map */
  _getSyncKey (syncType, userWallet, secondaryEndpoint) {
    return `${syncType}::${userWallet}::${secondaryEndpoint}`
  }

  /** Return job info of sync with given properties if present else null */
  getDuplicateSyncJobInfo (syncType, userWallet, secondaryEndpoint) {
    const syncKey = this._getSyncKey(syncType, userWallet, secondaryEndpoint)

    const duplicateSyncJobInfo = this.waitingSyncsByUserWalletMap[syncKey]
    return duplicateSyncJobInfo || null
  }

  /** Record job info for sync with given properties */
  recordSync (syncType, userWallet, secondaryEndpoint, jobInfo) {
    const syncKey = this._getSyncKey(syncType, userWallet, secondaryEndpoint)

    this.waitingSyncsByUserWalletMap[syncKey] = jobInfo
  }

  /** Remove sync with given properties */
  removeSync (syncType, userWallet, secondaryEndpoint) {
    const syncKey = this._getSyncKey(syncType, userWallet, secondaryEndpoint)

    delete this.waitingSyncsByUserWalletMap[syncKey]
  }
}

module.exports = { SnapbackSM, SyncType }

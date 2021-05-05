const Bull = require('bull')
const axios = require('axios')

const utils = require('./utils')
const models = require('./models')
const { logger } = require('./logging')

// Maximum number of time to wait for a sync operation, 6 minutes by default
const MaxSyncMonitoringDurationInMs = 360000

// Retry delay between requests during monitoring
const SyncMonitoringRetryDelayMs = 15000

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
    this.snapbackDevModeEnabled = true // this.nodeConfig.get('snapbackDevModeEnabled')

    this.MaxManualRequestSyncJobConcurrency = this.nodeConfig.get('maxManualRequestSyncJobConcurrency')
    this.MaxRecurringRequestSyncJobConcurrency = this.nodeConfig.get('maxRecurringRequestSyncJobConcurrency')

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
   */
  async init () {
    // Empty all queues to minimize memory consumption
    await this.stateMachineQueue.empty()
    await this.manualSyncQueue.empty()
    await this.recurringSyncQueue.empty()

    // SyncDeDuplicator ensure a sync for a (syncType, userWallet, secondaryEndpoint) tuple is only enqueued once
    this.syncDeDuplicator = new SyncDeDuplicator()

    // Short-circuit if (isUserMetadataNode = true)
    const isUserMetadata = this.nodeConfig.get('isUserMetadataNode')
    if (isUserMetadata) {
      this.log(`SnapbackSM disabled for userMetadataNode. ${this.endpoint}, isUserMetadata=${isUserMetadata}`)
      return
    }

    /**
     * Initialize all queue processors
     */

    // Initialize stateMachineQueue job processor
    // - Re-adds job to queue after processing current job, with a fixed delay
    this.stateMachineQueue.process(
      async (job, done) => {
        try {
          await this.processStateMachineOperation()
        } catch (e) {
          this.log(`StateMachineQueue error processing ${e}`)
        }

        const stateMachineJobInterval = (this.snapbackDevModeEnabled) ? DevDelayInMS : ProductionJobDelayInMs

        this.log(`StateMachineQueue (snapbackDevModeEnabled = ${this.snapbackDevModeEnabled}) || Triggering next job in ${stateMachineJobInterval}`)
        await utils.timeout(stateMachineJobInterval)

        await this.stateMachineQueue.add({ starttime: Date.now() })

        done()
      }
    )

    // Initialize manualSyncQueue job processor
    this.manualSyncQueue.process(
      this.MaxManualRequestSyncJobConcurrency,
      async (job, done) => {
        try {
          await this.processSyncOperation(job, SyncType.Manual)
        } catch (e) {
          this.log(`ManualSyncQueue processing error: ${e}`)
        }

        done()
      }
    )

    // Initialize recurringSyncQueue job processor
    this.recurringSyncQueue.process(
      this.MaxRecurringRequestSyncJobConcurrency,
      async (job, done) => {
        try {
          await this.processSyncOperation(job, SyncType.Recurring)
        } catch (e) {
          this.log(`RecurringSyncQueue processing error ${e}`)
        }

        done()
      }
    )

    // Enqueue first state machine operation (the processor internally re-enqueues job on recurring interval)
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

  /**
   * Retrieve users with this node as replica (primary or secondary)
   *  - Makes single request to discovery node to retrieve all users
   *
   * @returns {Array} array of objects
   *  - Each object has schema { primary, secondary1, secondary2, user_id, wallet }
   */
  async getNodeUsers () {
    // Fetch discovery node currently connected to libs as this can change
    const discoveryProviderEndpoint = this.audiusLibs.discoveryProvider.discoveryProviderEndpoint

    // Re-initialize if no discovery provider selected by libs instance
    if (!discoveryProviderEndpoint) {
      throw new Error('No discovery provider currently selected, exiting')
    }

    // Request all users that have this node as a replica (either primary or secondary)
    const requestParams = {
      method: 'get',
      baseURL: discoveryProviderEndpoint,
      url: `users/content_node/all`,
      params: {
        creator_node_endpoint: this.endpoint
      }
    }
    const resp = await axios(requestParams)

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
   * Enqueues a sync request to secondary on specified syncQueue and returns job info
   *
   * @dev NOTE avoid using bull priority if possible as it significantly reduces performance
   * @dev TODO no need to accept `primaryEndpoint` as param, it always equals `this.endpoint`
   */
  async enqueueSync ({
    userWallet,
    primaryEndpoint,
    secondaryEndpoint,
    syncType
  }) {
    const queue = (syncType === SyncType.Manual) ? this.manualSyncQueue : this.recurringSyncQueue

    // If duplicate sync already exists, do not add and instead return existing sync job info
    const duplicateSyncJobInfo = this.syncDeDuplicator.getDuplicateSyncJobInfo(syncType, userWallet, secondaryEndpoint)
    if (duplicateSyncJobInfo) {
      this.log(`enqueueSync Failure - a sync of type ${syncType} is already waiting for user wallet ${userWallet} against secondary ${secondaryEndpoint}`)

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
   * @param {Array} nodeUserInfoList array of objects of schema { primary, secondary1, secondary2, user_id, wallet }
   * @returns {Array} array of content node endpoint strings
   */
  async computeContentNodePeerSet (nodeUserInfoList) {
    let peerList = (
      nodeUserInfoList.map(userInfo => userInfo.primary)
      .concat(nodeUserInfoList.map(userInfo => userInfo.secondary1))
      .concat(nodeUserInfoList.map(userInfo => userInfo.secondary2))
    )

    peerList = peerList.filter(Boolean) // filter out falsey values

    peerList = peerList.filter(peer => (peer != this.endpoint)) // remove self from peerList

    let peerSet = new Set(peerList) // convert to Set to get uniques

    // TODO decide if return as set or list (for now just return as is, consider changing when doing monitoring work)
    return peerSet
  }

  /**
   * Determines if a peer node is sufficiently healthy and able to process syncRequests, or if it needs to be cycled out
   *
   * Peer health criteria:
   * - query verbose health check with timeout
   *    - TODO ensure 200 response
   *    - TODO ensure min free storage
   *    - TODO ensure min free memory
   *    - TODO ensure min CPUs
   *    - TODO ensure min version, spID etc? seems overkill
   *
   * - LATER gateway health - ping randomly selected shared CID
   *    - depends on nodes sync status, cannot request CID node hasn't synced yet
   *
   * - LATER sync health
   *    - sync step records success/failure in redis
   *
   * - LATER upload health - TBD
   *
   * @param {string} endpoint
   * @returns {Boolean}
   */
  async determinePeerHealth (endpoint) {
    let healthy = true

    try {
      // Axios request will throw on timeout or non-200 response
      await axios({
        method: 'get',
        baseURL: endpoint,
        url: '/health_check/verbose',
        timeout: 2000 // TODO config var
      })

    } catch (e) {
      healthy = false
    }

    return healthy
  }

  /**
   * Update replica set on chain for user, given current configs
   * Select new secondary via libs
   */
  async issueUpdateReplicaSetOp (userId, wallet, primary, secondary1, secondary2, unhealthyReplica) {
    // await libs.userReplicaSetManagerClient._updateReplicaSet(userId, primary, [new secondaries], primary, [old secondaries])

    this.log(`Updating Replica Set for userID ${userId} & wallet ${wallet} from old replicaSet [${primary},${secondary1},${secondary2}] due to unhealthy replica ${unhealthyReplica}`)
  }

  buildSecondaryNodesToUserWalletsMap (usersRequiringSyncRequests) {
    const secondaryNodesToUserWalletsMap = {}

    usersRequiringSyncRequests.forEach(userInfo => {
      const { wallet, secondary1, secondary2 } = userInfo
      const secondaries = ([secondary1, secondary2]).filter(Boolean)

      secondaries.forEach(secondary => {
        // Initialize empty array for node in map if needed
        if (!secondaryNodesToUserWalletsMap[secondary]) {
          secondaryNodesToUserWalletsMap[secondary] = []
        }

        // Push wallet into map
        secondaryNodesToUserWalletsMap[secondary].push(wallet)
      })
    })

    return secondaryNodesToUserWalletsMap
  }

  async retrieveClockStatusesForSecondaryUsersFromNodes (secondaryNodesToUserWalletsMap) {
    const secondaryNodesToUserClockStatusesMap = {}

    const secondaryNodes = Object.keys(secondaryNodesToUserWalletsMap)

    await Promise.all(secondaryNodes.map(async (secondaryNode) => {
      secondaryNodesToUserClockStatusesMap[secondaryNode] = {}

      const secondaryNodeUserWallets = secondaryNodesToUserWalletsMap[secondaryNode]

      const axiosReqParams = {
        baseURL: secondaryNode,
        url: '/users/batch_clock_status',
        method: 'post',
        data: { 'walletPublicKeys': secondaryNodeUserWallets }
      }

      // TODO convert to axios-retry, wrap in try-catch
      const userClockStatuses = (await axios(axiosReqParams)).data.data.users

      userClockStatuses.forEach(userClockStatus => {
        
      })
    }))
  }

  /** TODO */
  async issueSyncRequests (usersRequiringSyncRequests, secondaryNodesToUserClockStatusesMap) {
    const userWallets = usersRequiringSyncRequests.map(user => user.wallet)
    const userPrimaryClockValues = await this.getUserPrimaryClockValues(userWallets)

    let numSyncRequestsIssued = 0

    await Promise.all(usersRequiringSyncRequests.map(async (user) => {
      try {
        // TODO - ensure non-null wallet (is this needed?)
        const { secondary1, secondary2, wallet } = user.wallet

        const userPrimaryClockVal = userPrimaryClockValues[wallet]

        // Determine if either secondary requires a sync by comparing clock values against primary (this node)
        const secondaries = ([secondary1, secondary2]).filter(Boolean)
        await Promise.all(secondaries.map(async (secondary) => {
          const userSecondaryClockVal = secondaryNodesToUserClockStatusesMap[secondary][wallet]
          const syncRequired = !userSecondaryClockVal || (userPrimaryClockVal > userSecondaryClockVal)

          if (syncRequired) {
            await this.enqueueSync({
              userWallet: wallet,
              secondaryEndpoint: secondary,
              primaryEndpoint: this.endpoint,
              syncType: SyncType.Recurring
            })

            numSyncRequestsIssued += 1
          }
        }))

        // Issue syncRequest if required
      } catch (e) {
        this.log(`Caught error for user ${user.wallet}, ${JSON.stringify(user)}, ${e.message}`)
      }
    }))

    return numSyncRequestsIssued
  }

  /**
   * New description
   * - get all users with this node in replica set DONE
   * - compute chunk of users for current processing run DONE
   * - compute peerset of all replicas in users list DONE
   * - check all peer health and record unhealthy peers DONE
   * - define updateReplicaSet = [] DONE
   * - define syncOps = [] DONE
   * - for every user: DONE
   *    - if replica is in unhealthy set, add to updateReplicaSet
   *    - else if this.node = primary, add to syncOps
   * - from syncOps array, build map of secondary node -> user_wallets[] DONE
   * - for every secondary node, query batch_clock_status[user_wallets] DONE
   *    - store into secondaryNodeUserClockStatuses map of node -> (map of user -> clock_status) DONE
   * - for every secondary syncOp in syncOps DONE
   *    - trigger sync DONE
   * - for every updateReplicaSet in updateReplicaSets: DONE
   *    - update replica set
   *
   *
   * Main state machine processing function
   * - Processes all users in chunks
   * - For every user on an unhealthy replica, issues an updateReplicaSet op to cycle them off
   * - For every user on a healthy replica, ensures replica is synced up
   * - Determines which users need to be processed and enqueues syncs to secondaries
   */
  async processStateMachineOperation () {
    this.log(`------------------Process SnapbackSM Operation, slice ${this.currentModuloSlice}------------------`)

    // Retrieve list of all users which have this node as replica (primary or secondary) from discovery node
    let nodeUsers = await this.getNodeUsers()

    /**
     * Select chunk of users to process in this run
     *  - User is selected if (user_id % ModuloBase = currentModuloSlice)
     *  - nodeUsers = array of objects of schema { primary, secondary1, secondary2, user_id, wallet }
     */
    nodeUsers = nodeUsers.filter(
      nodeUser => (nodeUser.user_id % ModuloBase === this.currentModuloSlice)
    )

    // Compute content node peerset from nodeUsers (all nodes that are in a shared replica set with this node)
    const peerSet = await this.computeContentNodePeerSet(nodeUsers)

    /**
     * Determine health for every peer
     * TODO change from sequential to chunked parallel
     */
    const unhealthyPeers = new Set()
    for await (const peer of peerSet) {
      const peerIsHealthy = await this.determinePeerHealth(peer)
      if (!peerIsHealthy) {
        unhealthyPeers.add(peer)
      }
    }

    // TODO document
    const usersRequiringReplicaSetUpdates = []
    const usersRequiringSyncRequests = []

    /**
     * For every node user, record sync requests to issue to secondaries if this node is primary
     *    and record replica set updates to issue for any unhealthy replicas
     *
     * TODO make this more readable -> maybe two separate loops? need to ensure mutual exclusivity
     */
    for (const nodeUser of nodeUsers) {
      const { primary, secondary1, secondary2 } = nodeUser

      if (primary === this.endpoint) {
        const secondaries = ([secondary1, secondary2]).filter(Boolean)
        for (const secondary of secondaries) {
          if (unhealthyPeers.has(secondary)) {
            usersRequiringReplicaSetUpdates.push({ ...nodeUser, unhealthyReplica: secondary })
          } else {
            usersRequiringSyncRequests.push({ ...nodeUser, endpoint: secondary })
          }
        }
      } else {
        const replicas = ([primary, secondary1, secondary2]).filter(Boolean).filter(replica => replica !== this.endpoint)
        for (const replica of replicas) {
          if (unhealthyPeers.has(replica)) {
            usersRequiringReplicaSetUpdates.push({ ...nodeUser, unhealthyReplica: replica })
          }
        }
      }
    }

    // Build map of secondary node to secondary user wallets array for later use
    const secondaryNodesToUserWalletsMap = this.buildSecondaryNodesToUserWalletsMap(usersRequiringSyncRequests)

    // Retrieve clock statuses for all secondary users from secondary nodes
    const secondaryNodesToUserClockStatusesMap = await this.retrieveClockStatusesForSecondaryUsersFromNodes(secondaryNodesToUserWalletsMap)

    // Issue all required sync requests
    const numSyncRequestsIssued = await this.issueSyncRequests(usersRequiringSyncRequests, secondaryNodesToUserClockStatusesMap)

    // Issue all required replica set updates
    for await (const userInfo of usersRequiringReplicaSetUpdates) {
      await this.issueUpdateReplicaSetOp(userInfo.user_id, userInfo.wallet, userInfo.primary, userInfo.secondary1, userInfo.secondary2, userInfo.unhealthyReplica)
    }

    // Increment and adjust current slice by ModuloBase
    const previousModuloSlice = this.currentModuloSlice
    this.currentModuloSlice += 1
    this.currentModuloSlice = this.currentModuloSlice % ModuloBase

    this.log(`------------------END Process SnapbackSM Operation || Issued ${numSyncRequestsIssued} SyncRequest ops in slice ${previousModuloSlice} of ${ModuloBase}. Moving to slice ${this.currentModuloSlice} ------------------`)
  }

  async processStateMachineOperationOld () {
    this.log(`------------------Process SnapbackSM Operation, slice ${this.currentModuloSlice}------------------`)

    // Retrieve list of all users which have this node as replica
    const nodeUsers = await this.getNodeUsers()
    const nodePrimaryUsers = nodeUsers.filter(userInfo => (userInfo.primary === this.endpoint))

    this.log(`NODEUSERS ${JSON.stringify(nodeUsers)}`)
    this.log(`NODEPRIMARYUSERS ${JSON.stringify(nodePrimaryUsers)}`)

    // Build content node peer set
    const peerSet = await this.computeContentNodePeerSet(nodeUsers)
    this.log(`PEERSET ${JSON.stringify(Array.from(peerSet))}`)

    /**
     * Build map of content node to list of all users that need to be processed
     * Determines user list by checking if user_id % moduloBase = currentModuloSlice
     */

    // Generate list of wallets by node to query clock number
    // Structured as { nodeEndpoint: [wallet1, wallet2, ...] }
    let nodeVectorClockQueryList = {}

    // Users actually selected to process
    let usersToProcess = []

    // Wallets being processed in this state machine operation
    let wallets = []

    nodePrimaryUsers.forEach(
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
    // For each user in the initially returned nodePrimaryUsers,
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
              await this.enqueueSync({
                userWallet,
                secondaryEndpoint: secondary1,
                primaryEndpoint: this.endpoint,
                syncType: SyncType.Recurring
              })

              numSyncsIssued += 1
            }

            // Enqueue sync for secondary2 if required
            if (secondary2SyncRequired && secondary2 != null) {
              await this.enqueueSync({
                userWallet,
                secondaryEndpoint: secondary2,
                primaryEndpoint: this.endpoint,
                syncType: SyncType.Recurring
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

    this.log(`------------------END Process SnapbackSM Operation || Issued ${numSyncsIssued} SyncRequest ops in slice ${previousModuloSlice} of ${ModuloBase}. Moving to slice ${this.currentModuloSlice} ------------------`)
  }

  /**
   * Monitor an ongoing sync operation for a given secondaryUrl and user wallet
   * Return boolean indicating if an additional sync is required
   *
   * Polls secondary for MaxSyncMonitoringDurationInMs
   */
  async additionalSyncIsRequired (userWallet, primaryClockValue, secondaryUrl, syncType) {
    const MaxExportClockValueRange = this.nodeConfig.get('maxExportClockValueRange')
    const logMsgString = `additionalSyncIsRequired (${syncType}): wallet ${userWallet} secondary ${secondaryUrl} primaryClock ${primaryClockValue}`

    // Define axios request object for secondary clock status request
    const clockStatusRequestParams = {
      method: 'get',
      baseURL: secondaryUrl,
      url: `/users/clock_status/${userWallet}`,
      responseType: 'json'
    }

    const startTimeMs = Date.now()
    const endTimeMs = startTimeMs + MaxSyncMonitoringDurationInMs

    let additionalSyncRequired = true
    while (Date.now() < endTimeMs) {
      try {
        const clockStatusResp = await axios(clockStatusRequestParams)
        const { clockValue: secondaryClockValue } = clockStatusResp.data.data

        this.log(`${logMsgString} secondaryClock ${secondaryClockValue}`)

        /**
         * One sync op can process at most MaxExportClockValueRange range
         * A larger clock diff will require multiple syncs; short-circuit monitoring
         */
        if (secondaryClockValue + MaxExportClockValueRange < primaryClockValue) {
          this.log(`${logMsgString} secondaryClock ${secondaryClockValue} || MaxExportClockValueRange exceeded -> re-enqueuing sync`)
          break

          /**
           * Stop monitoring once secondary has caught up
           * Note - secondaryClockValue can be greater than primaryClockValue if additional
           *    data was written to primary after primaryClockValue was computed
           */
        } else if (secondaryClockValue >= primaryClockValue) {
          this.log(`${logMsgString} secondaryClock ${secondaryClockValue} || Sync completed in ${Date.now() - startTimeMs}ms`)
          additionalSyncRequired = false
          break
        }
      } catch (e) {
        this.log(`${logMsgString} || Error: ${e.message}`)
      }

      // Delay between retries
      await utils.timeout(SyncMonitoringRetryDelayMs, false)
    }

    return additionalSyncRequired
  }

  /**
   * Processes job as it is picked off the queue
   *  - Handles sync jobs for manualSyncQueue and recurringSyncQueue
   *  - Given job data, triggers sync request to secondary
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

    // primaryClockValue is used in additionalSyncIsRequired() call below
    const primaryClockValue = (await this.getUserPrimaryClockValues([userWallet]))[userWallet]

    this.log(`------------------Process SYNC | User ${userWallet} | Secondary: ${secondaryEndpoint} | Primary clock value ${primaryClockValue} | type: ${syncType} | jobID: ${id} ------------------`)

    // Issue sync request to secondary
    await axios(syncRequestParameters)

    // Wait until has sync has completed (within time threshold)
    const additionalSyncRequired = await this.additionalSyncIsRequired(
      userWallet,
      primaryClockValue,
      secondaryEndpoint,
      syncType
    )

    /**
     * Re-enqueue sync if required
     *
     * TODO can infinite loop on failing sync ops, but should not block any users as
     *    it enqueues job to the end of the queue
     */
    if (additionalSyncRequired) {
      await this.enqueueSync({
        userWallet,
        primaryEndpoint: this.endpoint,
        secondaryEndpoint,
        syncType
      })
    }

    // Exit when sync status is computed
    this.log(`------------------END Process SYNC | jobID: ${id}------------------`)
  }

  /**
   * Returns all jobs from manualSyncQueue and recurringSyncQueue, keyed by status
   *
   * @dev TODO may be worth manually recording + exposing completed jobs count
   *    completed and failed job records are disabled in createBullQueue()
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
 *
 * TODO - move to separate file
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

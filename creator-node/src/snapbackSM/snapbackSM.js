const Bull = require('bull')
const axios = require('axios')

const utils = require('../utils')
const models = require('../models')
const { logger } = require('../logging')

const SyncDeDuplicator = require('./snapbackDeDuplicator')
const PeerSetManager = require('./peerSetManager')
const CreatorNode = require('@audius/libs/src/services/creatorNode')
const SecondarySyncHealthTracker = require('./secondarySyncHealthTracker')

// Maximum number of time to wait for a sync operation, 6 minutes by default
const MaxSyncMonitoringDurationInMs = 360000 // ms

// Retry delay between requests during monitoring
const SyncMonitoringRetryDelayMs = 15000

// Max number of attempts to select new replica set in reconfig
const MAX_SELECT_NEW_REPLICA_SET_ATTEMPTS = 100

// Describes the type of sync operation
const SyncType = Object.freeze({
  Recurring: 'RECURRING' /** scheduled background sync to keep secondaries up to date */,
  Manual: 'MANUAL' /** triggered by a user data write to primary */
})

// Phases in `issueUpdateReplicaSetOp`. Used for debugging if method fails
const issueUpdateReplicaSetOpPhases = Object.freeze({
  GET_HEALTHY_CONTENT_NODES: 'GET_HEALTHY_CONTENT_NODES',
  ENQUEUE_SYNCS: 'ENQUEUE_SYNCS',
  UPDATE_URSM_REPLICA_SET: 'UPDATE_URSM_REPLICA_SET'
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

    // 1/<moduloBase> users are handled over <snapbackJobInterval> ms interval
    // ex: 1/<24> users are handled over <3600000> ms (1 hour)
    this.moduloBase = this.nodeConfig.get('snapbackModuloBase')

    // Incremented as users are processed
    this.currentModuloSlice = this.randomStartingSlice()

    // PeerSetManager instance to determine the peer set and its health state
    this.peerSetManager = new PeerSetManager({
      discoveryProviderEndpoint: audiusLibs.discoveryProvider.discoveryProviderEndpoint,
      creatorNodeEndpoint: this.endpoint
    })

    // Config to determine if reconfig is enabled
    this.snapbackReconfigEnabled = this.nodeConfig.get('snapbackReconfigEnabled')

    // The interval when SnapbackSM is fired for state machine jobs
    this.snapbackJobInterval = this.nodeConfig.get('snapbackJobInterval') // ms

    // Mapping of Content Node endpoint to its service provider ID
    this.endpointToSPIdMap = {}
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

        await utils.timeout(this.snapbackJobInterval)

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

    this.log(`SnapbackSM initialized in ${this.snapbackDevModeEnabled ? 'dev' : 'production'} mode. Added initial stateMachineQueue job; next job in ${this.snapbackJobInterval}ms`)
  }

  log (msg) {
    logger.info(`SnapbackSM: ${msg}`)
  }

  logError (msg) {
    logger.error(`SnapbackSM ERROR: ${msg}`)
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
    let slice = Math.floor(Math.random() * Math.floor(this.moduloBase))
    this.log(`Starting at data slice ${slice}/${this.moduloBase}`)
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
    syncType,
    immediate = false
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
        sync_type: syncType,
        // immediate = true will ensure secondary skips debounce and evaluates sync immediately
        immediate
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
   * Depending on the size of `unhealthyReplicas`:
   * 1. Determine a new replica set
   * 2. Write new replica set to URSM
   * 3. Sync data to new replica set
   *
   * @param {number} userId user id to issue a reconfiguration for
   * @param {string} wallet wallet address of user id
   * @param {string} primary endpoint of the current primary node on replica set
   * @param {string} secondary1 endpoint of the current first secondary node on replica set
   * @param {string} secondary2 endpoint of the current second secondary node on replica set
   * @param {string[]} unhealthyReplicas array of endpoints of current replica set nodes that are unhealthy
   * @param {string[]} healthyNodes array of healthy Content Node endpoints used for selecting new replica set
  */
  async issueUpdateReplicaSetOp (userId, wallet, primary, secondary1, secondary2, unhealthyReplicas, healthyNodes) {
    this.log(`[issueUpdateReplicaSetOp] userId=${userId} wallet=${wallet} unhealthy replica set=[${unhealthyReplicas}]`)

    const unhealthyReplicasSet = new Set(unhealthyReplicas)
    const baseSyncRequestParams = { userWallet: wallet, syncType: SyncType.Manual }
    let newReplicaSetSPIds = []

    // If a primary is currently unhealthy or more than one node is unhealthy, skip for now
    if (unhealthyReplicasSet.has(primary) || unhealthyReplicas.length > 1) {
      this.log(`[issueUpdateReplicaSetOp] userId=${userId} skipping reconfig.`)
      return
    }

    let errorMsg = null
    let phase = ''
    try {
      // Generate new replica set
      phase = issueUpdateReplicaSetOpPhases.GET_HEALTHY_CONTENT_NODES
      const { newPrimary, newSecondary1, newSecondary2 } = await this.determineNewReplicaSet({
        wallet,
        secondary1,
        secondary2,
        primary,
        unhealthyReplicasSet,
        healthyNodes
      })

      this.log(`[issueUpdateReplicaSetOp] Updating userId=${userId} wallet=${wallet} replica set=[${primary},${secondary1},${secondary2}] to new replica set=[${newPrimary},${newSecondary1},${newSecondary2}]`)

      if (!this.snapbackReconfigEnabled) return

      // Create new array of replica set spIds and write to URSM
      phase = issueUpdateReplicaSetOpPhases.UPDATE_URSM_REPLICA_SET
      newReplicaSetSPIds = [
        this.endpointToSPIdMap[newPrimary],
        this.endpointToSPIdMap[newSecondary1],
        this.endpointToSPIdMap[newSecondary2]
      ]

      await this.audiusLibs.contracts.UserReplicaSetManagerClient.updateReplicaSet(
        userId,
        newReplicaSetSPIds[0], // primary
        newReplicaSetSPIds.slice(1) // [secondary1, secondary2]
      )

      // Sync data from existing primary to new secondary
      phase = issueUpdateReplicaSetOpPhases.ENQUEUE_SYNCS
      await this.enqueueSync({
        ...baseSyncRequestParams,
        primaryEndpoint: primary,
        secondaryEndpoint: newSecondary2
      })
    } catch (e) {
      errorMsg = `[issueUpdateReplicaSetOp] userId=${userId} wallet=${wallet} failed at phase=${phase} reconfiguring to spIds=[${newReplicaSetSPIds}]: ${e.toString()}\n${e.stack}`
    }

    return errorMsg
  }

  /**
   * @param {Object} param
   * @param {string} param.primary current user's primary endpoint
   * @param {string} param.secondary1 current user's first secondary endpoint
   * @param {string} param.secondary2 current user's second secondary endpoint
   * @param {string} param.wallet current user's wallet address
   * @param {string[]} param.unhealthyReplicasSet an array of endpoints of unhealthy replica set nodes
   * @param {string[]} param.healthyNodes array of healthy Content Node endpoints used for selecting new replica set
   * @returns {Object}
   * {
   *  newPrimary: {string} the endpoint of the newly selected primary,
   *  newSecondary1: {string} the endpoint of the newly selected secondary #1,
   *  newSecondary2: {string} the endpoint of the newly selected secondary #2
   * }
   */
  async determineNewReplicaSet ({ primary, secondary1, secondary2, wallet, unhealthyReplicasSet, healthyNodes }) {
    let currentNodeHasExistingUserState = true
    let i = 0
    let newSecondary
    while (currentNodeHasExistingUserState && i++ < MAX_SELECT_NEW_REPLICA_SET_ATTEMPTS) {
      // Make sure current replica set will not be chosen as potential nodes for the new replica set
      const healthyPotentialPeers = healthyNodes.filter(node => node !== primary && node !== secondary1 && node !== secondary2)

      // Select a random node that is not from the current replica set
      newSecondary = healthyPotentialPeers[Math.floor(Math.random() * healthyPotentialPeers.length)]

      // Check to make sure that the newly selected secondary does not have existing user state
      try {
        const clockValue = await CreatorNode.getClockValue(newSecondary, wallet)
        if (clockValue === -1) currentNodeHasExistingUserState = false
      } catch (e) {
        // Something went wrong in checking clock value. Reselect another secondary.
        this.logError(e.message)
      }
    }

    if (currentNodeHasExistingUserState) throw new Error(`Unable to select new secondary given current healthy Content Nodes=[${healthyNodes}]`)

    const currentHealthySecondary = unhealthyReplicasSet.has(secondary1) ? secondary2 : secondary1

    // NOTE: For v0 implementation, `newSecondary2` will be the newly selected secondary, whilst the other nodes will be the
    // original replica set primary and secondary1
    return {
      newPrimary: primary,
      newSecondary1: currentHealthySecondary,
      newSecondary2: newSecondary
    }
  }

  /**
   * Converts provided array of SyncRequests to issue to a map(secondaryNode => userWallets[]) for easier access
   *
   * @param {Array} potentialSyncRequests array of objects with schema { user_id, wallet, primary, secondary1, secondary2, endpoint }
   * @returns {Object} map of secondary endpoint strings to array of wallet strings of users with that node as secondary
   */
  buildSecondaryNodesToUserWalletsMap (potentialSyncRequests) {
    const secondaryNodesToUserWalletsMap = {}

    potentialSyncRequests.forEach(userInfo => {
      const { wallet, endpoint: secondary } = userInfo

      if (!secondaryNodesToUserWalletsMap[secondary]) {
        secondaryNodesToUserWalletsMap[secondary] = []
      }

      secondaryNodesToUserWalletsMap[secondary].push(wallet)
    })

    return secondaryNodesToUserWalletsMap
  }

  /**
   * Given map(secondaryNode => userWallets[]), retrieves clock values for every (secondaryNode, userWallet) pair
   *
   * @returns {Object} map of secondary endpoint strings to (map of user wallet strings to clock value of secondary for user)
   */
  async retrieveClockStatusesForSecondaryUsersFromNodes (secondaryNodesToUserWalletsMap) {
    const secondaryNodesToUserClockValuesMap = {}

    const secondaryNodes = Object.keys(secondaryNodesToUserWalletsMap)

    // TODO change to batched parallel requests
    await Promise.all(secondaryNodes.map(async (secondaryNode) => {
      secondaryNodesToUserClockValuesMap[secondaryNode] = {}

      const secondaryNodeUserWallets = secondaryNodesToUserWalletsMap[secondaryNode]

      const axiosReqParams = {
        baseURL: secondaryNode,
        url: '/users/batch_clock_status',
        method: 'post',
        data: { 'walletPublicKeys': secondaryNodeUserWallets }
      }

      // TODO convert to axios-retry, wrap in try-catch
      const userClockValuesResp = (await axios(axiosReqParams)).data.data.users

      userClockValuesResp.forEach(userClockValueResp => {
        const { walletPublicKey, clock } = userClockValueResp
        try {
          secondaryNodesToUserClockValuesMap[secondaryNode][walletPublicKey] = clock
        } catch (e) {
          this.log(`Error updating secondaryNodesToUserClockValuesMap for wallet ${walletPublicKey} to clock ${clock}`)
          throw e
        }
      })
    }))

    return secondaryNodesToUserClockValuesMap
  }

  /**
   * Issues SyncRequests for every (user, secondary) pair if needed
   * Only issues requests if primary clock value is greater than secondary clock value
   *
   * @param {Array} userReplicaSets array of objects of schema { user_id, wallet, primary, secondary1, secondary2, endpoint }
   *      `endpoint` field indicates secondary on which to issue SyncRequest
   * @param {Object} secondaryNodesToUserClockStatusesMap map(secondaryNode => map(userWallet => secondaryClockValue))
   * @returns {Number} number of sync requests issued
   * @returns {Array} array of all SyncRequest errors
   */
  async issueSyncRequests (userReplicaSets, secondaryNodesToUserClockStatusesMap) {
    // TODO ensure all syncRequests are for users with primary == self

    // Retrieve clock values for all users on this node, which is their primary
    const userWallets = userReplicaSets.map(user => user.wallet)
    const userPrimaryClockValues = await this.getUserPrimaryClockValues(userWallets)

    let numSyncRequestsRequired = 0
    let numSyncRequestsEnqueued = 0
    let enqueueSyncRequestErrors = []

    // TODO change to chunked parallel
    await Promise.all(userReplicaSets.map(async (user) => {
      try {
        const { wallet, endpoint: secondary } = user

        // TODO - throw on null wallet (is this needed?)

        // Determine if secondary requires a sync by comparing clock values against primary (this node)
        const userPrimaryClockVal = userPrimaryClockValues[wallet]
        const userSecondaryClockVal = secondaryNodesToUserClockStatusesMap[secondary][wallet]
        const syncRequired = !userSecondaryClockVal || (userPrimaryClockVal > userSecondaryClockVal)

        if (syncRequired) {
          numSyncRequestsRequired += 1

          await this.enqueueSync({
            userWallet: wallet,
            secondaryEndpoint: secondary,
            primaryEndpoint: this.endpoint,
            syncType: SyncType.Recurring
          })

          numSyncRequestsEnqueued += 1
        }
      } catch (e) {
        enqueueSyncRequestErrors.push(`issueSyncRequest() Error for user ${JSON.stringify(user)} - ${e.message}`)
      }
    }))

    return { numSyncRequestsRequired, numSyncRequestsEnqueued, enqueueSyncRequestErrors }
  }

  /**
   * Main state machine processing function
   * - Processes all users in chunks
   * - For every user on an unhealthy replica, issues an updateReplicaSet op to cycle them off
   * - For every (primary) user on a healthy secondary replica, issues SyncRequest op to secondary
   *
   * @note refer to git history for reference to `processStateMachineOperationOld()`
   */
  async processStateMachineOperation () {
    // Record all stages of this function along with associated information for use in logging
    let decisionTree = [{
      stage: 'BEGIN processStateMachineOperation()',
      vals: {
        currentModuloSlice: this.currentModuloSlice,
        moduloBase: this.moduloBase
      },
      time: Date.now()
    }]

    try {
      let nodeUsers
      try {
        nodeUsers = await this.peerSetManager.getNodeUsers()
        nodeUsers = this.sliceUsers(nodeUsers)

        decisionTree.push({ stage: 'getNodeUsers() and sliceUsers() Success', vals: { nodeUsersLength: nodeUsers.length }, time: Date.now() })
      } catch (e) {
        decisionTree.push({ stage: 'getNodeUsers() or sliceUsers() Error', vals: e.message, time: Date.now() })
        throw new Error(`processStateMachineOperation():getNodeUsers()/sliceUsers() Error: ${e.toString()}`)
      }

      let unhealthyPeers
      try {
        unhealthyPeers = await this.peerSetManager.getUnhealthyPeers(nodeUsers)
        decisionTree.push({
          stage: 'getUnhealthyPeers() Success',
          vals: {
            unhealthyPeerSetLength: unhealthyPeers.size,
            unhealthyPeers: Array.from(unhealthyPeers)
          },
          time: Date.now()
        })
      } catch (e) {
        decisionTree.push({ stage: 'processStateMachineOperation():getUnhealthyPeers() Error', vals: e.message, time: Date.now() })
        throw new Error(`processStateMachineOperation():getUnhealthyPeers() Error: ${e.toString()}`)
      }

      // Lists to aggregate all required ReplicaSetUpdate ops and potential SyncRequest ops
      const requiredUpdateReplicaSetOps = []
      const potentialSyncRequests = []

      /**
       * For every node user, record sync requests to issue to secondaries if this node is primary
       *    and record replica set updates to issue for any unhealthy replicas
       *
       * Purpose for the if/else case is that if the current node is a primary, issue reconfig or sync requests.
       * Else, if the current node is a secondary, only issue reconfig requests.
       *
       * @notice this will issue sync to healthy secondary and update replica set away from unhealthy secondary
       */
      for (const nodeUser of nodeUsers) {
        const { primary, secondary1, secondary2 } = nodeUser
        let unhealthyReplicas = []

        /**
         * If this node is primary for user, check both secondaries for health
         * Enqueue SyncRequests against healthy secondaries, and enqueue UpdateReplicaSetOps against unhealthy secondaries
         */
        if (primary === this.endpoint) {
          // filter out false-y values to account for incomplete replica sets
          const secondaries = ([secondary1, secondary2]).filter(Boolean)

          /**
           * If either secondary is in `unhealthyPeers` list, add it to `unhealthyReplicas` list
           */
          for (const secondary of secondaries) {
            if (unhealthyPeers.has(secondary)) {
              unhealthyReplicas.push(secondary)
            } else {
              potentialSyncRequests.push({ ...nodeUser, endpoint: secondary })
            }
          }

          /**
           * If either secondary has a Sync success rate for user below threshold, add it to `unhealthyReplicas` list
           */
          // Fetch secondary SyncRequest outcomes from SecondarySyncHealthTracker
          const userSecondarySyncHealthOutcomes = await SecondarySyncHealthTracker.getSyncMetricsForUser(nodeUser.wallet)

          // Compute sync success rate per secondary per user
          let sec1UserSyncSuccesses = 0, sec1UserSyncFailures = 0, sec2UserSyncSuccesses = 0, sec2UserSyncFailures = 0
          for (let [key, count] of Object.entries(userSecondarySyncHealthOutcomes)) {
            count = parseInt(count)
            if (key.includes(secondary1) && key.includes('Success')) {
              sec1UserSyncSuccesses += count
            } else if (key.includes(secondary1) && key.includes('Failure')) {
              sec1UserSyncFailures += count
            } if (key.includes(secondary1) && key.includes('Success')) {
              sec2UserSyncSuccesses += count
            } if (key.includes(secondary1) && key.includes('Failure')) {
              sec2UserSyncFailures += count
            } else {
              // this can be hit if old secondaries are present, should be ignored
            }
          }

          // Compute sync success rates for both secondaries
          const sec1UserSyncSuccessRate = (sec1UserSyncFailures === 0) ? 1 : (sec1UserSyncSuccesses / secondary1SyncFailures)
          const sec2UserSyncSuccessRate = (sec2UserSyncFailures === 0) ? 1 : (sec2UserSyncSuccesses / secondary2SyncFailures)

          // If success rate for either secondary falls under threshold -> mark as unhealthy
          if (sec1UserSyncSuccessRate < 0.5 && !unhealthyReplicas.includes(secondary1)) {
            unhealthyReplicas.push(secondary1)
          }
          if (sec2UserSyncSuccessRate < 0.5 && !unhealthyReplicas.includes(secondary2)) {
            unhealthyReplicas.push(secondary2)
          }

          /**
           * If any unhealthy replicas found for user, enqueue an updateReplicaSetOp for later processing
           */
          if (unhealthyReplicas.length > 0) {
            requiredUpdateReplicaSetOps.push({ ...nodeUser, unhealthyReplicas })
          }

          /**
           * If this node is secondary for user, check both secondaries for health and enqueue SyncRequests against healthy secondaries
           * Ignore unhealthy secondaries for now
           */
        } else {
          // filter out false-y values to account for incomplete replica sets
          let replicas = ([primary, secondary1, secondary2]).filter(Boolean)
          // filter out this endpoint
          replicas = replicas.filter(replica => replica !== this.endpoint)

          for (const replica of replicas) {
            if (unhealthyPeers.has(replica)) {
              unhealthyReplicas.push(replica)
            }
          }

          if (unhealthyReplicas.length > 0) {
            requiredUpdateReplicaSetOps.push({ ...nodeUser, unhealthyReplicas })
          }
        }
      }
      decisionTree.push({
        stage: 'Build requiredUpdateReplicaSetOps and potentialSyncRequests arrays',
        vals: {
          requiredUpdateReplicaSetOpsLength: requiredUpdateReplicaSetOps.length,
          potentialSyncRequestsLength: potentialSyncRequests.length
        },
        time: Date.now()
      })

      // Build map of secondary node to secondary user wallets array
      const secondaryNodesToUserWalletsMap = this.buildSecondaryNodesToUserWalletsMap(potentialSyncRequests)
      decisionTree.push({
        stage: 'buildSecondaryNodesToUserWalletsMap() Success',
        vals: { numSecondaryNodes: Object.keys(secondaryNodesToUserWalletsMap).length },
        time: Date.now()
      })

      // Retrieve clock statuses for all secondary users from secondary nodes
      let secondaryNodesToUserClockStatusesMap
      try {
        secondaryNodesToUserClockStatusesMap = await this.retrieveClockStatusesForSecondaryUsersFromNodes(
          secondaryNodesToUserWalletsMap
        )
        decisionTree.push({
          stage: 'retrieveClockStatusesForSecondaryUsersFromNodes() Success',
          vals: { },
          time: Date.now()
        })
      } catch (e) {
        decisionTree.push({
          stage: 'retrieveClockStatusesForSecondaryUsersFromNodes() Error',
          vals: e.message,
          time: Date.now()
        })
        throw new Error('processStateMachineOperation():retrieveClockStatusesForSecondaryUsersFromNodes() Error')
      }

      // Setup the mapping of Content Node endpoint to service provider id. Used in reconfig
      const previousSnapbackReconfigEnabledValue = this.snapbackReconfigEnabled
      await this.updateEndpointToSpIdMap()
      decisionTree.push({
        stage: `updateEndpointToSpIdMap()`,
        vals: {
          previousSnapbackReconfigEnabledValue,
          currentSnapbackReconfigEnabledValue: this.snapbackReconfigEnabled,
          endpointToSPIdMapSize: Object.keys(this.endpointToSPIdMap).length
        },
        time: Date.now()
      })

      // Issue all required sync requests
      let numSyncRequestsRequired, numSyncRequestsEnqueued, enqueueSyncRequestErrors
      try {
        const resp = await this.issueSyncRequests(potentialSyncRequests, secondaryNodesToUserClockStatusesMap)
        numSyncRequestsRequired = resp.numSyncRequestsRequired
        numSyncRequestsEnqueued = resp.numSyncRequestsEnqueued
        enqueueSyncRequestErrors = resp.enqueueSyncRequestErrors

        // Error if > 50% syncRequests fail
        if (enqueueSyncRequestErrors.length > numSyncRequestsEnqueued) {
          throw new Error('More than 50% of SyncRequests failed to be enqueued')
        }

        decisionTree.push({
          stage: 'issueSyncRequests() Success',
          vals: {
            numSyncRequestsRequired,
            numSyncRequestsEnqueued,
            numIssueSyncRequestErrors: enqueueSyncRequestErrors.length,
            enqueueSyncRequestErrors
          },
          time: Date.now()
        })
      } catch (e) {
        decisionTree.push({
          stage: 'issueSyncRequests() Error',
          vals: {
            error: e.message,
            numSyncRequestsRequired,
            numSyncRequestsEnqueued,
            numIssueSyncRequestErrors: (enqueueSyncRequestErrors ? enqueueSyncRequestErrors.length : null),
            enqueueSyncRequestErrors
          },
          time: Date.now()
        })
      }

      /**
       * Issue all required replica set updates
       * TODO move to chunked parallel (maybe?) + wrap each in try-catch to not halt on single error
       */
      let numUpdateReplicaOpsIssued = 0
      try {
        // Fetch all the healthy nodes while disabling sync checks to select nodes for new replica set
        // Note: sync checks are disabled because there should not be any syncs occurring for a particular user
        // on a new replica set. Also, the sync check logic is coupled with a user state on the userStateManager.
        // There will be an explicit clock value check on the newly selected replica set nodes instead.
        const { services: healthyServicesMap } = await this.audiusLibs.ServiceProvider.autoSelectCreatorNodes({
          performSyncCheck: false
        })

        const healthyNodes = Object.keys(healthyServicesMap)
        if (healthyNodes.length === 0) throw new Error('Auto-selecting Content Nodes returned an empty list of healthy nodes.')

        const errors = []
        for await (const userInfo of requiredUpdateReplicaSetOps) {
          const errorMsg = await this.issueUpdateReplicaSetOp(
            userInfo.user_id,
            userInfo.wallet,
            userInfo.primary,
            userInfo.secondary1,
            userInfo.secondary2,
            userInfo.unhealthyReplicas,
            healthyNodes
          )

          errorMsg ? errors.push(errorMsg) : numUpdateReplicaOpsIssued++
        }
        if (errors.length > 0) throw new Error(`issueUpdateReplicaSetOp() failed for subset of users: [${errors.toString()}]`)

        decisionTree.push({
          stage: 'issueUpdateReplicaSetOp() Success',
          vals: { numUpdateReplicaOpsIssued },
          time: Date.now()
        })
      } catch (e) {
        decisionTree.push({
          stage: 'issueUpdateReplicaSetOp() Error',
          vals: e.message,
          time: Date.now()
        })
        throw new Error('processStateMachineOperation():issueUpdateReplicaSetOp() Error')
      }

      decisionTree.push({
        stage: 'END processStateMachineOperation()',
        vals: {
          currentModuloSlice: this.currentModuloSlice,
          moduloBase: this.moduloBase,
          numSyncRequestsEnqueued,
          numUpdateReplicaOpsIssued
        },
        time: Date.now()
      })

      // Log error without throwing - next run will attempt to rectify
    } catch (e) {
      decisionTree.push({ stage: 'processStateMachineOperation Error', vals: e.message, time: Date.now() })
    } finally {
      // Increment and adjust current slice by this.moduloBase
      this.currentModuloSlice += 1
      this.currentModuloSlice = this.currentModuloSlice % this.moduloBase

      // Log decision tree
      try {
        this.log(`processStateMachineOperation Decision Tree ${JSON.stringify(decisionTree)}`)
      } catch (e) {
        this.logError(`Error printing processStateMachineOperation Decision Tree ${decisionTree}`)
      }
    }
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
    let maxExportRangeExceeded = false
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
          maxExportRangeExceeded = true
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

    /**
     * As Primary for user, record syncRequest outcomes to all secondaries
     * For now, ignore syncRequests where a secondary is behind by more than `MaxExportClockValueRange` as
     *    primary doesn't currently have sufficient tracking
     */
    if (!additionalSyncRequired && !maxExportRangeExceeded) {
      await SecondarySyncHealthTracker.recordSuccess(secondaryUrl, userWallet, syncType)
    } else {
      await SecondarySyncHealthTracker.recordFailure(secondaryUrl, userWallet, syncType)
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

  /**
   * Select chunk of users to process in this run
   *  - User is selected if (user_id % moduloBase = currentModuloSlice)
   * @param {Object[]} nodeUsers array of objects of schema { primary, secondary1, secondary2, user_id, wallet }
   */
  sliceUsers (nodeUsers) {
    return nodeUsers.filter(nodeUser =>
      nodeUser.user_id % this.moduloBase === this.currentModuloSlice
    )
  }

  /**
   * Issues syncRequest for user against secondary, and polls for replication up to primary
   * If secondary fails to sync within specified timeoutMs, will error
   */
  async issueSyncRequestsUntilSynced (secondaryUrl, wallet, primaryClockVal, timeoutMs) {
    // Issue syncRequest before polling secondary for replication
    await this.enqueueSync({
      userWallet: wallet,
      secondaryEndpoint: secondaryUrl,
      primaryEndpoint: this.endpoint,
      syncType: SyncType.Manual,
      immediate: true
    })

    // Poll clock status and issue syncRequests until secondary is caught up or until timeoutMs
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      try {
        // Retrieve secondary clock status for user
        const secondaryClockStatusResp = await axios({
          method: 'get',
          baseURL: secondaryUrl,
          url: `/users/clock_status/${wallet}`,
          responseType: 'json',
          timeout: 1000 // 1000ms = 1s
        })
        const { clockValue: secondaryClockVal, syncInProgress } = secondaryClockStatusResp.data.data

        // If secondary is synced, return successfully
        if (secondaryClockVal >= primaryClockVal) {
          return

          // Else, if a sync is not already in progress on the secondary, issue a new SyncRequest
        } else if (!syncInProgress) {
          await this.enqueueSync({
            userWallet: wallet,
            secondaryEndpoint: secondaryUrl,
            primaryEndpoint: this.endpoint,
            syncType: SyncType.Manual
          })
        }

        // Give secondary some time to process ongoing or newly enqueued sync
        // NOTE - we might want to make this timeout longer
        await utils.timeout(500)
      } catch (e) {
        // do nothing and let while loop continue
      }
    }

    // This condition will only be hit if the secondary has failed to sync within timeoutMs
    throw new Error(`Secondary ${secondaryUrl} did not sync up to primary for user ${wallet} within ${timeoutMs}ms`)
  }

  /**
   * Updates `this.endpointToSPIdMap` to the mapping of <endpoint : spId>. If the fetch fails, rely on the previous
   * `this.endpointToSPIdMap` value. If the previous value is also an empty object, disable reconfig.
   */
  async updateEndpointToSpIdMap () {
    let endpointToSPIdMap = {}
    try {
      const contentNodes = await this.audiusLibs.ethContracts.getServiceProviderList('content-node')
      contentNodes.forEach(cn => { endpointToSPIdMap[cn.endpoint] = cn.spID })
    } catch (e) {
      this.logError(`[updateEndpointToSpIdMap]: ${e.message}`)
    }

    if (Object.keys(endpointToSPIdMap).length > 0) this.endpointToSPIdMap = endpointToSPIdMap
    if (Object.keys(this.endpointToSPIdMap).length === 0) {
      this.logError('[updateEndpointToSpIdMap]: Unable to initialize this.endpointToSPIdMap')
      this.snapbackReconfigEnabled = false
    } else {
      this.snapbackReconfigEnabled = this.nodeConfig.get('snapbackReconfigEnabled')
    }
  }
}

module.exports = { SnapbackSM, SyncType }

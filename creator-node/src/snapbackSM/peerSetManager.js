const axios = require('axios')
const { CancelToken } = axios

const config = require('../config')
const asyncRetry = require('../utils/asyncRetry')
const { logger } = require('../logging')
const {
  GET_NODE_USERS_TIMEOUT_MS,
  GET_NODE_USERS_CANCEL_TOKEN_MS,
  GET_NODE_USERS_DEFAULT_PAGE_SIZE
} = require('./StateMachineConstants')
const { hasEnoughStorageSpace } = require('../fileManager')

const PEER_HEALTH_CHECK_REQUEST_TIMEOUT_MS = config.get(
  'peerHealthCheckRequestTimeout'
)
const MINIMUM_MEMORY_AVAILABLE = config.get('minimumMemoryAvailable')
const MAX_FILE_DESCRIPTORS_ALLOCATED_PERCENTAGE =
  config.get('maxFileDescriptorsAllocatedPercentage') / 100
const MINIMUM_DAILY_SYNC_COUNT = config.get('minimumDailySyncCount')
const MINIMUM_ROLLING_SYNC_COUNT = config.get('minimumRollingSyncCount')
const MINIMUM_SUCCESSFUL_SYNC_COUNT_PERCENTAGE =
  config.get('minimumSuccessfulSyncCountPercentage') / 100

// Used in determining primary health
const MAX_NUMBER_SECONDS_PRIMARY_REMAINS_UNHEALTHY = config.get(
  'maxNumberSecondsPrimaryRemainsUnhealthy'
)
const MAX_STORAGE_USED_PERCENT = config.get('maxStorageUsedPercent')

class PeerSetManager {
  constructor({
    discoveryProviderEndpoint,
    creatorNodeEndpoint,
    maxNumberSecondsPrimaryRemainsUnhealthy
  }) {
    this.discoveryProviderEndpoint = discoveryProviderEndpoint
    this.creatorNodeEndpoint = creatorNodeEndpoint

    /* We do not want to eagerly cycle off the primary when issuing reconfigs if necessary, as the primary may
      have data that the secondaries lack. This map is used to track the primary and the number of times it has
      failed a health check.

      Schema:
      {
        {string} endpoint - the endpoint of the primary: {number} number of times a primary failed a health check
      }
    */
    this.primaryToEarliestFailedHealthCheckTimestamp = {}

    // Mapping of Content Node endpoint to its service provider ID
    this.endpointToSPIdMap = {}

    // Max number of hours a primary may be unhealthy for since the first time it was seen as unhealthy
    this.maxNumberSecondsPrimaryRemainsUnhealthy = isNaN(
      parseInt(maxNumberSecondsPrimaryRemainsUnhealthy)
    )
      ? MAX_NUMBER_SECONDS_PRIMARY_REMAINS_UNHEALTHY
      : maxNumberSecondsPrimaryRemainsUnhealthy
  }

  log(msg) {
    logger.info(`SnapbackSM:::PeerSetManager: ${msg}`)
  }

  logError(msg) {
    logger.error(`SnapbackSM:::PeerSetManager ERROR: ${msg}`)
  }

  /**
   * Performs a health check on the peer set
   * @param {Object[]} nodeUsers array of objects of schema { primary, secondary1, secondary2, user_id, wallet }
   * @param {boolean?} [performSimpleCheck=false] flag to dictate whether or not to check health check response to
   *  determine node health
   * @returns the unhealthy peers in a Set
   *
   * @note consider returning healthy set?
   * TODO - add retry logic to node requests
   */
  async getUnhealthyPeers(nodeUsers, performSimpleCheck = false) {
    // Compute content node peerset from nodeUsers (all nodes that are in a shared replica set with this node)
    const peerSet = this.computeContentNodePeerSet(nodeUsers)

    /**
     * Determine health for every peer & build list of unhealthy peers
     * TODO: change from sequential to chunked parallel
     */
    const unhealthyPeers = new Set()

    for await (const peer of peerSet) {
      const isHealthy = await this.isNodeHealthy(peer, performSimpleCheck)
      if (!isHealthy) {
        unhealthyPeers.add(peer)
      }
    }

    return unhealthyPeers
  }

  async isNodeHealthy(peer, performSimpleCheck = false) {
    try {
      const verboseHealthCheckResp = await this.queryVerboseHealthCheck(peer)
      if (!performSimpleCheck) {
        this.determinePeerHealth(verboseHealthCheckResp)
      }
    } catch (e) {
      this.logError(
        `isNodeHealthy() peer=${peer} is unhealthy: ${e.toString()}`
      )
      return false
    }

    return true
  }

  /**
   * Retrieve users with this node as replica (primary or secondary).
   * Makes single request to discovery node to retrieve all users, optionally paginated
   *
   * @notice Discovery Nodes will ignore these params if they're not updated to the version which added pagination
   * @param prevUserId user_id is used for pagination, where each paginated request returns
   *                   maxUsers number of users starting at a user with id=user_id
   * @param maxUsers the maximum number of users to fetch
   * @returns {Object[]} array of objects of shape { primary, secondary1, secondary2, user_id, wallet, primarySpID, secondary1SpID, secondary2SpID }
   */
  async getNodeUsers(
    prevUserId = 0,
    maxUsers = GET_NODE_USERS_DEFAULT_PAGE_SIZE
  ) {
    // Fetch discovery node currently connected to libs as this can change
    if (!this.discoveryProviderEndpoint) {
      throw new Error('No discovery provider currently selected, exiting')
    }

    // Will throw error on non-200 response
    let nodeUsers
    try {
      // Cancel the request if it hasn't succeeded/failed/timed out after 70 seconds
      const cancelTokenSource = CancelToken.source()
      setTimeout(
        () =>
          cancelTokenSource.cancel(
            `getNodeUsers took more than ${GET_NODE_USERS_CANCEL_TOKEN_MS}ms and did not time out`
          ),
        GET_NODE_USERS_CANCEL_TOKEN_MS
      )

      // Request all users that have this node as a replica (either primary or secondary)
      const resp = await asyncRetry({
        logLabel: 'fetch all users with this node in replica',
        asyncFn: async () => {
          return axios({
            method: 'get',
            baseURL: this.discoveryProviderEndpoint,
            url: `v1/full/users/content_node/all`,
            params: {
              creator_node_endpoint: this.creatorNodeEndpoint,
              prev_user_id: prevUserId,
              max_users: maxUsers
            },
            timeout: GET_NODE_USERS_TIMEOUT_MS,
            cancelToken: cancelTokenSource.token
          })
        },
        logger
      })
      nodeUsers = resp.data.data
    } catch (e) {
      if (axios.isCancel(e)) {
        logger.error(`getNodeUsers request canceled: ${e.message}`)
      }
      throw new Error(
        `getNodeUsers() Error: ${e.toString()} - connected discprov [${
          this.discoveryProviderEndpoint
        }]`
      )
    } finally {
      logger.info(`getNodeUsers() nodeUsers.length: ${nodeUsers?.length}`)
    }

    // Ensure every object in response array contains all required fields
    for (const nodeUser of nodeUsers) {
      const requiredFields = [
        'user_id',
        'wallet',
        'primary',
        'secondary1',
        'secondary2',
        'primarySpID',
        'secondary1SpID',
        'secondary2SpID'
      ]
      const responseFields = Object.keys(nodeUser)
      const allRequiredFieldsPresent = requiredFields.every((requiredField) =>
        responseFields.includes(requiredField)
      )
      if (!allRequiredFieldsPresent) {
        throw new Error(
          'getNodeUsers() Error: Unexpected response format during getNodeUsers() call'
        )
      }
    }

    return nodeUsers
  }

  /**
   * @param {Object[]} nodeUserInfoList array of objects of schema { primary, secondary1, secondary2, user_id, wallet }
   * @returns {Set} Set of content node endpoint strings
   */
  computeContentNodePeerSet(nodeUserInfoList) {
    // Aggregate all nodes from user replica sets
    let peerList = nodeUserInfoList
      .map((userInfo) => userInfo.primary)
      .concat(nodeUserInfoList.map((userInfo) => userInfo.secondary1))
      .concat(nodeUserInfoList.map((userInfo) => userInfo.secondary2))

    peerList = peerList
      .filter(Boolean) // filter out false-y values to account for incomplete replica sets
      .filter((peer) => peer !== this.creatorNodeEndpoint) // remove self from peerList

    const peerSet = new Set(peerList) // convert to Set to get uniques

    return peerSet
  }

  /**
   * Returns /health_check/verbose response
   * TODO: - consider moving this pure function to libs
   *
   * @param {string} endpoint
   * @returns {Object} the /health_check/verbose response
   */
  async queryVerboseHealthCheck(endpoint) {
    // Axios request will throw on timeout or non-200 response
    const resp = await axios({
      baseURL: endpoint,
      url: '/health_check/verbose',
      method: 'get',
      timeout: PEER_HEALTH_CHECK_REQUEST_TIMEOUT_MS,
      headers: {
        'User-Agent': `Axios - @audius/content-node - ${config.get(
          'creatorNodeEndpoint'
        )} - peerSetManager#queryVerboseHealthCheck`
      }
    })

    return resp.data.data
  }

  /**
   * Takes data off the verbose health check response and determines the peer heatlh
   * @param {Object} verboseHealthCheckResp verbose health check response
   *
   * TODO: consolidate CreatorNodeSelection + peer set health check calculation logic
   */
  determinePeerHealth(verboseHealthCheckResp) {
    // Check for sufficient minimum storage size
    const { storagePathSize, storagePathUsed } = verboseHealthCheckResp
    if (
      storagePathSize &&
      storagePathUsed &&
      !hasEnoughStorageSpace({
        storagePathSize,
        storagePathUsed,
        maxStorageUsedPercent: MAX_STORAGE_USED_PERCENT
      })
    ) {
      throw new Error(
        `Almost out of storage=${
          storagePathSize - storagePathUsed
        }bytes remaining out of ${storagePathSize}. Requires less than ${MAX_STORAGE_USED_PERCENT}% used`
      )
    }

    // Check for sufficient memory space
    const { usedMemory, totalMemory } = verboseHealthCheckResp
    if (
      usedMemory &&
      totalMemory &&
      totalMemory - usedMemory <= MINIMUM_MEMORY_AVAILABLE
    ) {
      throw new Error(
        `Running low on memory=${
          totalMemory - usedMemory
        }bytes remaining. Minimum memory required=${MINIMUM_MEMORY_AVAILABLE}bytes`
      )
    }

    // Check for sufficient file descriptors space
    const { allocatedFileDescriptors, maxFileDescriptors } =
      verboseHealthCheckResp
    if (
      allocatedFileDescriptors &&
      maxFileDescriptors &&
      allocatedFileDescriptors / maxFileDescriptors >=
        MAX_FILE_DESCRIPTORS_ALLOCATED_PERCENTAGE
    ) {
      throw new Error(
        `Running low on file descriptors availability=${
          (allocatedFileDescriptors / maxFileDescriptors) * 100
        }% used. Max file descriptors allocated percentage allowed=${
          MAX_FILE_DESCRIPTORS_ALLOCATED_PERCENTAGE * 100
        }%`
      )
    }

    // Check historical sync data for current day
    const { dailySyncSuccessCount, dailySyncFailCount } = verboseHealthCheckResp
    if (
      dailySyncSuccessCount &&
      dailySyncFailCount &&
      dailySyncSuccessCount + dailySyncFailCount > MINIMUM_DAILY_SYNC_COUNT &&
      dailySyncSuccessCount / (dailySyncFailCount + dailySyncSuccessCount) <
        MINIMUM_SUCCESSFUL_SYNC_COUNT_PERCENTAGE
    ) {
      throw new Error(
        `Latest daily sync data shows that this node fails at a high rate of syncs. Successful syncs=${dailySyncSuccessCount} || Failed syncs=${dailySyncFailCount}. Minimum successful sync percentage=${
          MINIMUM_SUCCESSFUL_SYNC_COUNT_PERCENTAGE * 100
        }%`
      )
    }

    // Check historical sync data for rolling window 30 days
    const { thirtyDayRollingSyncSuccessCount, thirtyDayRollingSyncFailCount } =
      verboseHealthCheckResp
    if (
      thirtyDayRollingSyncSuccessCount &&
      thirtyDayRollingSyncFailCount &&
      thirtyDayRollingSyncSuccessCount + thirtyDayRollingSyncFailCount >
        MINIMUM_ROLLING_SYNC_COUNT &&
      thirtyDayRollingSyncSuccessCount /
        (thirtyDayRollingSyncFailCount + thirtyDayRollingSyncSuccessCount) <
        MINIMUM_SUCCESSFUL_SYNC_COUNT_PERCENTAGE
    ) {
      throw new Error(
        `Rolling sync data shows that this node fails at a high rate of syncs. Successful syncs=${thirtyDayRollingSyncSuccessCount} || Failed syncs=${thirtyDayRollingSyncFailCount}. Minimum successful sync percentage=${
          MINIMUM_SUCCESSFUL_SYNC_COUNT_PERCENTAGE * 100
        }%`
      )
    }
  }

  /**
   * Updates `this.endpointToSPIdMap` to the mapping of <endpoint : spId>. If the fetch fails, rely on the previous
   * `this.endpointToSPIdMap` value. If the existing map is empty, throw error as we need this map to issue reconfigs.
   * @param {Object} ethContracts audiusLibs.ethContracts instance; has helper fn to get service provider info
   */
  async updateEndpointToSpIdMap(ethContracts) {
    const endpointToSPIdMap = {}
    try {
      const contentNodes = await ethContracts.getServiceProviderList(
        'content-node'
      )
      contentNodes.forEach((cn) => {
        endpointToSPIdMap[cn.endpoint] = cn.spID
      })
    } catch (e) {
      this.logError(`[updateEndpointToSpIdMap]: ${e.message}`)
    }

    if (Object.keys(endpointToSPIdMap).length > 0)
      this.endpointToSPIdMap = endpointToSPIdMap
    if (Object.keys(this.endpointToSPIdMap).length === 0) {
      const errorMsg =
        '[updateEndpointToSpIdMap]: Unable to initialize this.endpointToSPIdMap'
      this.logError(errorMsg)
      throw new Error(errorMsg)
    }
  }

  /**
   * Converts provided array of nodeUser info to issue to a map(replica set node => userWallets[]) for easier access
   *
   * @param {Array} nodeUsers array of objects with schema { user_id, wallet, primary, secondary1, secondary2 }
   * @returns {Object} map of replica set endpoint strings to array of wallet strings of users with that node as part of replica set
   */
  buildReplicaSetNodesToUserWalletsMap(nodeUsers) {
    const replicaSetNodesToUserWalletsMap = {}

    nodeUsers.forEach((userInfo) => {
      const { wallet, primary, secondary1, secondary2 } = userInfo
      const replicaSet = [primary, secondary1, secondary2]

      replicaSet.forEach((node) => {
        if (!replicaSetNodesToUserWalletsMap[node]) {
          replicaSetNodesToUserWalletsMap[node] = []
        }

        replicaSetNodesToUserWalletsMap[node].push(wallet)
      })
    })

    return replicaSetNodesToUserWalletsMap
  }

  // ============== `this.unhealthyPrimaryToWalletMap` functions ==============

  /**
   * Perform a simple health check to see if a primary is truly unhealthy. If the primary returns a
   * non-200 response, track the timestamp in the map. If the health check has failed for a primary over
   * `this.maxNumberSecondsPrimaryRemainsUnhealthy`, return as unhealthy. Else, keep track of the timestamp
   * of the visit if not already tracked.
   *
   * If the primary is healthy, reset the counter in the map and return as healthy.
   * @param {string} primary primary endpoint
   * @returns boolean of whether primary is healthy or not
   */
  async isPrimaryHealthy(primary) {
    const isHealthy = await this.isNodeHealthy(primary, true)

    if (!isHealthy) {
      const failedTimestamp =
        this.getEarliestFailedHealthCheckTimestamp(primary)

      if (failedTimestamp) {
        // Generate the date of the failed timestamp + max hours threshold
        const failedTimestampPlusThreshold = new Date(failedTimestamp)
        failedTimestampPlusThreshold.setSeconds(
          failedTimestamp.getSeconds() +
            this.maxNumberSecondsPrimaryRemainsUnhealthy
        )

        // Determine if the failed timestamp + max hours threshold surpasses our allowed time threshold
        const now = new Date()
        if (now >= failedTimestampPlusThreshold) {
          return false
        }
      } else {
        this.addHealthCheckTimestamp(primary)
      }
      return true
    }

    // If a primary ever becomes healthy again and was once marked as unhealthy, remove tracker
    this.removePrimaryFromUnhealthyPrimaryMap(primary)
    return true
  }

  getEarliestFailedHealthCheckTimestamp(primary) {
    return this.primaryToEarliestFailedHealthCheckTimestamp[primary]
      ? this.primaryToEarliestFailedHealthCheckTimestamp[primary]
      : null
  }

  addHealthCheckTimestamp(primary) {
    this.primaryToEarliestFailedHealthCheckTimestamp[primary] = new Date()
  }

  removePrimaryFromUnhealthyPrimaryMap(primary) {
    delete this.primaryToEarliestFailedHealthCheckTimestamp[primary]
  }
}
module.exports = PeerSetManager

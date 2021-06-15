const axios = require('axios')

const { logger } = require('../logging')

// TODO: config var
// Can adjust as necessary
const PEER_HEALTH_CHECK_REQUEST_TIMEOUT = 2000 // ms
const MINIMUM_STORAGE_PATH_SIZE = 100000000000 // bytes; 100GB
const MINIMUM_MEMORY_UNUSED = 6000000000 // bytes; 6GB
const MAX_FILE_DESCRIPTORS_OPEN = 0.95 // percent
// Minimum count of daily syncs that need to have occurred to consider daily sync history
const MINIMUM_DAILY_SYNC_COUNT = 50
// Minimum count of rolling syncs that need to have occurred to consider rolling sync history
const MINIMUM_ROLLING_SYNC_COUNT = 5000
// Minimum percentage of failed syncs to be considered unhealthy
const MINIMUM_SYNC_FAIL_COUNT_PERCENTAGE = 0.50

class PeerSetManager {
  constructor ({ discoveryProviderEndpoint, creatorNodeEndpoint }) {
    this.discoveryProviderEndpoint = discoveryProviderEndpoint
    this.creatorNodeEndpoint = creatorNodeEndpoint
  }

  log (msg) {
    logger.info(`SnapbackSM:::PeerSetManager: ${msg}`)
  }

  logError (msg) {
    logger.error(`SnapbackSM:::PeerSetManager ERROR: ${msg}`)
  }

  /**
   * Retrieves node users, paritions it into a slice, computes the peer set of the node users,
   * and performs a health check on the peer set.
   * @param {Object[]} nodeUsers array of objects of schema { primary, secondary1, secondary2, user_id, wallet }
   * @returns the unhealthy peers in a Set
   *
   * @note consider returning healthy set?
   */
  async getUnhealthyPeers (nodeUsers) {
    // Compute content node peerset from nodeUsers (all nodes that are in a shared replica set with this node)
    let peerSet = this.computeContentNodePeerSet(nodeUsers)

    /**
     * Determine health for every peer & build list of unhealthy peers
     * TODO: change from sequential to chunked parallel
     */
    const unhealthyPeers = new Set()

    for await (const peer of peerSet) {
      try {
        const verboseHealthCheckResp = await this.getPeerHealth(peer)
        this.determinePeerHealth(verboseHealthCheckResp)
      } catch (e) {
        unhealthyPeers.add(peer)
        this.logError(`getUnhealthyPeers() peer=${peer} is unhealthy: ${e.toString()}`)
      }
    }

    return unhealthyPeers
  }

  /**
   * Retrieve list of all users which have this node as replica (primary or secondary) from discovery node
   * Or retrieve primary users only if connected to old discprov
   *
   * Also handles backwards compatibility of getAllNodeUsers() and getNodePrimaryUsers()
   * This only works if both functions have a consistent return format
   */
  async getNodeUsers () {
    let fetchUsersSuccess = false
    let nodeUsers

    let firstFetchError = null
    try {
      // Retrieves users from route `v1/full/users/content_node/all`
      nodeUsers = await this.getAllNodeUsers()
      fetchUsersSuccess = true
    } catch (e) {
      firstFetchError = e
    }

    if (!fetchUsersSuccess) {
      try {
        // Retrieves users from route `users/creator_node`
        nodeUsers = await this.getNodePrimaryUsers()
      } catch (secondFetchError) {
        throw new Error(`getAllNodeUsers() Error: ${firstFetchError.toString()}\n\ngetNodePrimaryUsers() Error: ${secondFetchError.toString()}`)
      }
    }

    // Ensure every object in response array contains all required fields
    nodeUsers.forEach(nodeUser => {
      const requiredFields = ['user_id', 'wallet', 'primary', 'secondary1', 'secondary2']
      const responseFields = Object.keys(nodeUser)
      const allRequiredFieldsPresent = requiredFields.every(requiredField => responseFields.includes(requiredField))
      if (!allRequiredFieldsPresent) {
        throw new Error('getNodeUsers() Error: Unexpected response format during getAllNodeUsers() or getNodePrimaryUsers() call')
      }
    })

    return nodeUsers
  }

  /**
   * Retrieve users with this node as replica (primary or secondary)
   *  - Makes single request to discovery node to retrieve all users
   *
   * @notice This function depends on a new discprov route and cannot be consumed until every discprov exposes that route
   *    It will throw if the route doesn't exist
   * @returns {Object[]} array of objects
   *  - Each object has schema { primary, secondary1, secondary2, user_id, wallet }
   */
  async getAllNodeUsers () {
    // Fetch discovery node currently connected to libs as this can change
    if (!this.discoveryProviderEndpoint) {
      throw new Error('No discovery provider currently selected, exiting')
    }

    // Request all users that have this node as a replica (either primary or secondary)
    const requestParams = {
      method: 'get',
      baseURL: this.discoveryProviderEndpoint,
      url: `v1/full/users/content_node/all`,
      params: {
        creator_node_endpoint: this.creatorNodeEndpoint
      }
    }

    // Will throw error on non-200 response
    let allNodeUsers
    try {
      const resp = await axios(requestParams)
      allNodeUsers = resp.data.data
    } catch (e) {
      throw new Error(`getAllNodeUsers() Error: ${e.toString()}`)
    }

    return allNodeUsers
  }

  /**
   * Retrieve users with this node as primary
   * Leaving this function in until all discovery providers update to new version and expose new `/users/content_node/all` route
   * @returns {Object[]} array of objects
   *  - Each object has schema { primary, secondary1, secondary2, user_id, wallet }
   */
  async getNodePrimaryUsers () {
    // Fetch discovery node currently connected to libs as this can change
    if (!this.discoveryProviderEndpoint) {
      throw new Error('No discovery provider currently selected, exiting')
    }

    const requestParams = {
      method: 'get',
      baseURL: this.discoveryProviderEndpoint,
      url: `users/creator_node`,
      params: {
        creator_node_endpoint: this.creatorNodeEndpoint
      }
    }

    // Will throw error on non-200 response
    let nodePrimaryUsers
    try {
      const resp = await axios(requestParams)
      nodePrimaryUsers = resp.data.data
    } catch (e) {
      throw new Error(`getNodePrimaryUsers() Error: ${e.toString()}`)
    }

    return nodePrimaryUsers
  }

  /**
   * @param {Object[]} nodeUserInfoList array of objects of schema { primary, secondary1, secondary2, user_id, wallet }
   * @returns {Set} Set of content node endpoint strings
   */
  computeContentNodePeerSet (nodeUserInfoList) {
    // Aggregate all nodes from user replica sets
    let peerList = (
      nodeUserInfoList.map(userInfo => userInfo.primary)
        .concat(nodeUserInfoList.map(userInfo => userInfo.secondary1))
        .concat(nodeUserInfoList.map(userInfo => userInfo.secondary2))
    )

    peerList = peerList.filter(Boolean) // filter out false-y values to account for incomplete replica sets
      .filter(peer => peer !== this.creatorNodeEndpoint) // remove self from peerList

    const peerSet = new Set(peerList) // convert to Set to get uniques

    return peerSet
  }

  /**
   * Determines if a peer node is sufficiently healthy and able to process syncRequests
   *
   * Peer health criteria:
   * - verbose health check returns 200 within timeout
   *
   * TODO: - consider moving this pure function to libs
   *
   * @param {string} endpoint
   * @returns {Object} the /health_check/verbose response
   */
  async getPeerHealth (endpoint) {
    // Axios request will throw on timeout or non-200 response
    const resp = await axios({
      baseURL: endpoint,
      url: '/health_check/verbose',
      method: 'get',
      timeout: PEER_HEALTH_CHECK_REQUEST_TIMEOUT
    })

    return resp.data.data
  }

  /**
   * Takes data off the verbose health check response and determines the peer heatlh
   * @param {Object} verboseHealthCheckResp verbose health check response
   *
   * TODO: consolidate CreatorNodeSelection + peer set health check calculation logic
   */
  determinePeerHealth (verboseHealthCheckResp) {
    // Check for sufficient minimum storage size
    const { storagePathSize, storagePathUsed } = verboseHealthCheckResp
    if (storagePathSize && storagePathUsed && storagePathSize - storagePathUsed <= MINIMUM_STORAGE_PATH_SIZE) {
      throw new Error(`Almost out of storage=${storagePathSize - storagePathUsed}bytes remaining`)
    }

    // Check for sufficient memory space
    const { usedMemory, totalMemory } = verboseHealthCheckResp
    if (usedMemory && totalMemory && totalMemory - usedMemory <= MINIMUM_MEMORY_UNUSED) {
      throw new Error(`Running low on memory=${totalMemory - usedMemory}bytes remaining`)
    }

    // Check for sufficient file descriptors space
    const { allocatedFileDescriptors, maxFileDescriptors } = verboseHealthCheckResp
    if (allocatedFileDescriptors && maxFileDescriptors && allocatedFileDescriptors / maxFileDescriptors >= MAX_FILE_DESCRIPTORS_OPEN) {
      throw new Error(`Running low on file descriptors availability=${allocatedFileDescriptors / maxFileDescriptors * 100}% used`)
    }

    // Check historical sync data for current day
    const { dailySyncSuccessCount, dailySyncFailCount } = verboseHealthCheckResp
    if (dailySyncSuccessCount &&
      dailySyncFailCount &&
      dailySyncSuccessCount + dailySyncFailCount > MINIMUM_DAILY_SYNC_COUNT &&
      dailySyncFailCount / (dailySyncFailCount + dailySyncSuccessCount) > MINIMUM_SYNC_FAIL_COUNT_PERCENTAGE) {
      throw new Error(`Latest daily sync data shows that this node is not accepting syncs. Successful syncs=${dailySyncSuccessCount} || Failed syncs=${dailySyncFailCount}`)
    }

    // Check historical sync data for rolling window 30 days
    const { thirtyDayRollingSyncSuccessCount, thirtyDayRollingSyncFailCount } = verboseHealthCheckResp
    if (thirtyDayRollingSyncSuccessCount &&
      thirtyDayRollingSyncFailCount &&
      thirtyDayRollingSyncSuccessCount + thirtyDayRollingSyncFailCount > MINIMUM_ROLLING_SYNC_COUNT &&
      thirtyDayRollingSyncFailCount / (thirtyDayRollingSyncFailCount + thirtyDayRollingSyncSuccessCount) > MINIMUM_SYNC_FAIL_COUNT_PERCENTAGE) {
      throw new Error(`Rolling sync data shows that this node historically does not accept syncs. Successful syncs=${thirtyDayRollingSyncSuccessCount} || Failed syncs=${thirtyDayRollingSyncFailCount}`)
    }
  }
}

module.exports = PeerSetManager

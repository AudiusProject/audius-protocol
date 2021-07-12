const axios = require('axios')

const config = require('../config')
const { logger } = require('../logging')

const PEER_HEALTH_CHECK_REQUEST_TIMEOUT = config.get('peerHealthCheckRequestTimeout')
const MINIMUM_STORAGE_PATH_SIZE = config.get('minimumStoragePathSize')
const MINIMUM_MEMORY_AVAILABLE = config.get('minimumMemoryAvailable')
const MAX_FILE_DESCRIPTORS_ALLOCATED_PERCENTAGE = config.get('maxFileDescriptorsAllocatedPercentage') / 100
const MINIMUM_DAILY_SYNC_COUNT = config.get('minimumDailySyncCount')
const MINIMUM_ROLLING_SYNC_COUNT = config.get('minimumRollingSyncCount')
const MINIMUM_SUCCESSFUL_SYNC_COUNT_PERCENTAGE = config.get('minimumSuccessfulSyncCountPercentage') / 100

class PeerSetManager {
  constructor ({ discoveryProviderEndpoint, creatorNodeEndpoint }) {
    this.discoveryProviderEndpoint = discoveryProviderEndpoint
    this.creatorNodeEndpoint = creatorNodeEndpoint

    /* We do not want to eagerly cycle off the primary when issuing reconfigs if necessary, as the primary may
      have data that the secondaries lack. In this case, wait until `this.moduloBase` iterations for the
      primary to potentially become healthy again. This map is used to track visited primaries for particular wallets.

      Schema:
      {
        {string} endpoint - the endpoint of the primary: {Set<string>} set of wallets for which the primary has been unhealthy for
      }
    */
    this.unhealthyPrimaryToWalletMap = {}

    // Mapping of Content Node endpoint to its service provider ID
    this.endpointToSPIdMap = {}
  }

  log (msg) {
    logger.info(`SnapbackSM:::PeerSetManager: ${msg}`)
  }

  logError (msg) {
    logger.error(`SnapbackSM:::PeerSetManager ERROR: ${msg}`)
  }

  /**
   * Performs a health check on the peer set
   * @param {Object[]} nodeUsers array of objects of schema { primary, secondary1, secondary2, user_id, wallet }
   * @returns the unhealthy peers in a Set
   *
   * @note consider returning healthy set?
   */
  async getUnhealthyPeers (nodeUsers, performSimpleCheck = false) {
    // Compute content node peerset from nodeUsers (all nodes that are in a shared replica set with this node)
    let peerSet = this.computeContentNodePeerSet(nodeUsers)

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

  async isNodeHealthy (peer, performSimpleCheck = false) {
    try {
      const verboseHealthCheckResp = await this.queryVerboseHealthCheck(peer)
      if (!performSimpleCheck) { this.determinePeerHealth(verboseHealthCheckResp) }
    } catch (e) {
      this.logError(`isNodeHealthy() peer=${peer} is unhealthy: ${e.toString()}`)
      return false
    }

    return true
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
   * Returns /health_check/verbose response
   * TODO: - consider moving this pure function to libs
   *
   * @param {string} endpoint
   * @returns {Object} the /health_check/verbose response
   */
  async queryVerboseHealthCheck (endpoint) {
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
    if (usedMemory && totalMemory && totalMemory - usedMemory <= MINIMUM_MEMORY_AVAILABLE) {
      throw new Error(`Running low on memory=${totalMemory - usedMemory}bytes remaining`)
    }

    // Check for sufficient file descriptors space
    const { allocatedFileDescriptors, maxFileDescriptors } = verboseHealthCheckResp
    if (allocatedFileDescriptors && maxFileDescriptors && allocatedFileDescriptors / maxFileDescriptors >= MAX_FILE_DESCRIPTORS_ALLOCATED_PERCENTAGE) {
      throw new Error(`Running low on file descriptors availability=${allocatedFileDescriptors / maxFileDescriptors * 100}% used`)
    }

    // Check historical sync data for current day
    const { dailySyncSuccessCount, dailySyncFailCount } = verboseHealthCheckResp
    if (dailySyncSuccessCount &&
      dailySyncFailCount &&
      dailySyncSuccessCount + dailySyncFailCount > MINIMUM_DAILY_SYNC_COUNT &&
      dailySyncSuccessCount / (dailySyncFailCount + dailySyncSuccessCount) < MINIMUM_SUCCESSFUL_SYNC_COUNT_PERCENTAGE) {
      throw new Error(`Latest daily sync data shows that this node fails at a high rate of syncs. Successful syncs=${dailySyncSuccessCount} || Failed syncs=${dailySyncFailCount}`)
    }

    // Check historical sync data for rolling window 30 days
    const { thirtyDayRollingSyncSuccessCount, thirtyDayRollingSyncFailCount } = verboseHealthCheckResp
    if (thirtyDayRollingSyncSuccessCount &&
      thirtyDayRollingSyncFailCount &&
      thirtyDayRollingSyncSuccessCount + thirtyDayRollingSyncFailCount > MINIMUM_ROLLING_SYNC_COUNT &&
      thirtyDayRollingSyncSuccessCount / (thirtyDayRollingSyncFailCount + thirtyDayRollingSyncSuccessCount) < MINIMUM_SUCCESSFUL_SYNC_COUNT_PERCENTAGE) {
      throw new Error(`Rolling sync data shows that this node fails at a high rate of syncs. Successful syncs=${thirtyDayRollingSyncSuccessCount} || Failed syncs=${thirtyDayRollingSyncFailCount}`)
    }
  }

  /**
   * Updates `this.endpointToSPIdMap` to the mapping of <endpoint : spId>. If the fetch fails, rely on the previous
   * `this.endpointToSPIdMap` value. If the existing map is empty, throw error as we need this map to issue reconfigs.
   * @param {Object} ethContracts audiusLibs.ethContracts instance; has helper fn to get service provider info
   */
  async updateEndpointToSpIdMap (ethContracts) {
    let endpointToSPIdMap = {}
    try {
      const contentNodes = await ethContracts.getServiceProviderList('content-node')
      contentNodes.forEach(cn => { endpointToSPIdMap[cn.endpoint] = cn.spID })
    } catch (e) {
      this.logError(`[updateEndpointToSpIdMap]: ${e.message}`)
    }

    if (Object.keys(endpointToSPIdMap).length > 0) this.endpointToSPIdMap = endpointToSPIdMap
    if (Object.keys(this.endpointToSPIdMap).length === 0) {
      const errorMsg = '[updateEndpointToSpIdMap]: Unable to initialize this.endpointToSPIdMap'
      this.logError(errorMsg)
      throw new Error(errorMsg)
    }
  }

  /**
   * Perform a simple health check to see if a primary is truly unhealthy.
   * @param {string} primary primary endpoint
   * @param {string} wallet user wallet
   * @returns boolean of whether primary is healthy or not
   */
  isPrimaryHealthy (primary, wallet) {
    // Check to see if the primary is healthy
    if (!this.isNodeHealthy(primary, true)) {
      if (this.walletInUnhealthyPrimaryMap(primary, wallet)) {
        // If this primary-wallet pair has been visited before, mark primary for that user as unhealthy
        return false
      } else {
        // Else, mark as visited and the current primary-wallet pair as healthy for the time being
        this.addWalletToUnhealthyPrimaryMap(primary, wallet)
        return true
      }
    }

    // The primary-wallet is healthy. Remove from map and mark as healthy
    this.removeWalletFromUnhealthyPrimaryMap(primary, wallet)
    return true
  }

  walletInUnhealthyPrimaryMap (primary, wallet) {
    if (this.unhealthyPrimaryToWalletMap[primary] && this.unhealthyPrimaryToWalletMap[primary].has(wallet)) {
      return true
    }
    return false
  }

  addWalletToUnhealthyPrimaryMap (primary, wallet) {
    if (!this.unhealthyPrimaryToWalletMap[primary]) {
      this.unhealthyPrimaryToWalletMap[primary] = new Set([wallet])
    } else {
      this.unhealthyPrimaryToWalletMap[primary].add(wallet)
    }
  }

  removeWalletFromUnhealthyPrimaryMap (primary, wallet) {
    if (this.walletInUnhealthyPrimaryMap(primary, wallet)) {
      this.unhealthyPrimaryToWalletMap[primary].delete(wallet)
    }
  }
}

module.exports = PeerSetManager

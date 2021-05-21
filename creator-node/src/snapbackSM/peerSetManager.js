const axios = require('axios')

const { logger } = require('../logging')

// TODO: config var
const PEER_HEALTH_CHECK_REQUEST_TIMEOUT = 2000

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
        // TODO: consider using the response
        await this.determinePeerHealth(peer)
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
   * Select chunk of users to process in this run
   *  - User is selected if (user_id % moduloBase = currentModuloSlice)
   * @param {Object} param
   * @param {Object[]} param.nodeUsers array of objects of schema { primary, secondary1, secondary2, user_id, wallet }
   * @param {number} param.moduluoBase
   * @param {number} param.currentModuloSlice
   */
  sliceUsers ({ nodeUsers, moduloBase, currentModuloSlice }) {
    return nodeUsers.filter(nodeUser =>
      nodeUser.user_id % moduloBase === currentModuloSlice
    )
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
   * @returns {Boolean}
   */
  async determinePeerHealth (endpoint) {
    // Axios request will throw on timeout or non-200 response
    return axios({
      baseURL: endpoint,
      url: '/health_check/verbose',
      method: 'get',
      timeout: PEER_HEALTH_CHECK_REQUEST_TIMEOUT
    })
  }
}

module.exports = PeerSetManager

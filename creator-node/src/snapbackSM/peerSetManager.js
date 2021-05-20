const axios = require('axios')

const { logger } = require('../logging')

// TODO: config var
const PEER_HEALTH_CHECK_REQUEST_TIMEOUT = 2000

class PeerSetManager {
  constructor (discoveryProviderEndpoint, currentModuloSlice, creatorNodeEndpoint, moduloBase) {
    this.currentModuloSlice = currentModuloSlice
    this.discoveryProviderEndpoint = discoveryProviderEndpoint
    this.creatorNodeEndpoint = creatorNodeEndpoint
    this.moduloBase = moduloBase
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
   * @param {Object[]} nodeUsers array of user info for those who have the current node as part of replica set.
   * The structure is the discovery node response from route `v1/full/users/content_node/all`
   * @param {Object[]} decisionTree the decisions metadata in the form of an Object array
   * @returns the unhealthy peers in a Set
   */
  async getUnhealthyPeers (nodeUsers, decisionTree) {
    // Compute content node peerset from nodeUsers (all nodes that are in a shared replica set with this node)
    let peerSet = []
    try {
      peerSet = this.computeContentNodePeerSet(nodeUsers, decisionTree)
    } catch (e) {
      decisionTree.push({ stage: '4/ computeContentNodePeerSet() Error', vals: e.message, time: Date.now() })
      throw new Error('getUnhealthyPeers():computeContentNodePeerSet() Error')
    }

    /**
     * Determine health for every peer & build list of unhealthy peers
     * TODO: change from sequential to chunked parallel
     */
    const unhealthyPeers = new Set()
    try {
      for await (const peer of peerSet) {
        const peerIsHealthy = await this.determinePeerHealth(peer)
        if (!peerIsHealthy) {
          unhealthyPeers.add(peer)
        }
      }

      decisionTree.push({
        stage: '5/ determinePeerHealth() Success',
        vals: {
          unhealthyPeerSetLength: unhealthyPeers.size,
          healthyPeerSetLength: peerSet.size - unhealthyPeers.size,
          unhealthyPeers: Array.from(unhealthyPeers)
        },
        time: Date.now()
      })
    } catch (e) {
      decisionTree.push({ stage: '5/ determinePeerHealth() Error', vals: e.message, time: Date.now() })
      throw new Error('getUnhealthyPeers():determinePeerHealth() Error')
    }

    return unhealthyPeers
  }

  /**
   * Wrapper method for retrieving all users on current node and slicing up a partition of it
   * @param {Object[]} decisionTree the decisions metadata in the form of an Object array
   * @returns a partition of the users that have this node as part of their replica sets
   */
  async getNodeUsersSlice (decisionTree) {
    let nodeUsers = await this.getNodeUsers(decisionTree)
    nodeUsers = this.sliceUsers(nodeUsers, decisionTree)

    return nodeUsers
  }

  /**
   * Retrieve list of all users which have this node as replica (primary or secondary) from discovery node
   * Or retrieve primary users only if connected to old discprov
   */
  async getNodeUsers (decisionTree) {
    let nodeUsers
    try {
      nodeUsers = await this._getNodeUsers(decisionTree)
      decisionTree.push({ stage: '2/ getNodeUsers() Success', vals: { nodeUsersLength: nodeUsers.length }, time: Date.now() })
    } catch (e) {
      decisionTree.push({ stage: '2/ getNodeUsers() Error', vals: e.message, time: Date.now() })
      throw new Error('getUnhealthyPeers():getNodeUsers() Error')
    }

    return nodeUsers
  }

  /**
   * Wrapper function to handle backwards compatibility of getAllNodeUsers() and getNodePrimaryUsers()
   * This only works if both functions have a consistent return format
   */
  async _getNodeUsers (decisionTree) {
    let nodeUsers

    try {
      // Use new function to retrieve all node users
      nodeUsers = await this.getAllNodeUsers(decisionTree)
    } catch (e) {
      // On failure, fallback to old function to retrieve all node primary users
      nodeUsers = await this.getNodePrimaryUsers()
    } finally {
      // Ensure every object in response array contains all required fields
      nodeUsers.forEach(nodeUser => {
        const requiredFields = ['user_id', 'wallet', 'primary', 'secondary1', 'secondary2']
        const responseFields = Object.keys(nodeUser)
        const allRequiredFieldsPresent = requiredFields.every(requiredField => responseFields.includes(requiredField))
        if (!allRequiredFieldsPresent) {
          throw new Error('Unexpected response format during getAllNodeUsers() or getNodePrimaryUsers() call')
        }
      })
    }

    return nodeUsers
  }

  /**
   * Retrieve users with this node as replica (primary or secondary)
   *  - Makes single request to discovery node to retrieve all users
   *
   * @notice This function depends on a new discprov route and cannot be consumed until every discprov exposes that route
   *    It will throw if the route doesn't exist
   *
   * @returns {Array} array of objects
   *  - Each object has schema { primary, secondary1, secondary2, user_id, wallet }
   */
  async getAllNodeUsers (decisionTree) {
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
    const resp = await axios(requestParams)
    const allNodeUsers = resp.data.data

    decisionTree.push({
      stage: '2.A/ getNodeUsers():getAllNodeUsers() Success',
      vals: { requestParams, numAllNodeUsers: allNodeUsers.length },
      time: Date.now()
    })

    return allNodeUsers
  }

  /**
   * Retrieve users with this node as primary
   * Leaving this function in until all discovery providers update to new version and expose new `/users/content_node/all` route
   *
   * @returns {Array} array of objects
   *  - Each object has schema { primary, secondary1, secondary2, user_id, wallet }
   */
  async getNodePrimaryUsers (decisionTree) {
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
    const resp = await axios(requestParams)
    const nodePrimaryUsers = resp.data.data

    decisionTree.push({
      stage: '2.A/ getNodeUsers():getAllNodeUsers() Failure; fallback getNodePrimaryUsers() Success',
      vals: { requestParams, numNodePrimaryUsers: nodePrimaryUsers.length },
      time: Date.now()
    })

    return nodePrimaryUsers
  }

  /**
   * Select chunk of users to process in this run
   *  - User is selected if (user_id % this.moduloBase = currentModuloSlice)
   *  - nodeUsers = array of objects of schema { primary, secondary1, secondary2, user_id, wallet }
   */
  sliceUsers (nodeUsers, decisionTree) {
    const filteredNodeUsers = nodeUsers.filter(nodeUser =>
      nodeUser.user_id % this.moduloBase === this.currentModuloSlice
    )

    decisionTree.push({
      stage: `3/ select nodeUsers modulo slice ${this.currentModuloSlice}`,
      vals: { nodeUsersSubsetLength: nodeUsers.length, moduloBase: this.moduloBase, currentModuloSlice: this.currentModuloSlice },
      time: Date.now()
    })

    return filteredNodeUsers
  }

  /**
   * @param {Array} nodeUserInfoList array of objects of schema { primary, secondary1, secondary2, user_id, wallet }
   * @returns {Set} Set of content node endpoint strings
   */
  computeContentNodePeerSet (nodeUserInfoList, decisionTree) {
    // Aggregate all nodes from user replica sets
    let peerList = (
      nodeUserInfoList.map(userInfo => userInfo.primary)
        .concat(nodeUserInfoList.map(userInfo => userInfo.secondary1))
        .concat(nodeUserInfoList.map(userInfo => userInfo.secondary2))
    )

    peerList = peerList.filter(Boolean) // filter out false-y values to account for incomplete replica sets
      .filter(peer => peer !== this.creatorNodeEndpoint) // remove self from peerList

    const peerSet = new Set(peerList) // convert to Set to get uniques

    decisionTree.push({
      stage: '4/ computeContentNodePeerSet() Success',
      vals: { peerSetLength: peerSet.size },
      time: Date.now()
    })

    return peerSet
  }

  /**
   * Determines if a peer node is sufficiently healthy and able to process syncRequests
   *
   * Peer health criteria:
   * - verbose health check returns 200 within timeout
   *
   * TODO - consider moving this pure function to libs
   *
   * @param {string} endpoint
   * @returns {Boolean}
   */
  async determinePeerHealth (endpoint) {
    let healthy = true

    try {
      // Axios request will throw on timeout or non-200 response
      await axios({
        baseURL: endpoint,
        url: '/health_check/verbose',
        method: 'get',
        timeout: PEER_HEALTH_CHECK_REQUEST_TIMEOUT
      })
    } catch (e) {
      healthy = false
    }

    return healthy
  }

  setCurrentModuloSlice (index) {
    this.currentModuloSlice = index
  }
}

module.exports = PeerSetManager

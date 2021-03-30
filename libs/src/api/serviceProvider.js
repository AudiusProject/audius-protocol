const { Base } = require('./base')
const { timeRequestsAndSortByVersion } = require('../utils/network')
const { CreatorNodeSelection } = require('../services/creatorNode/CreatorNodeSelection')

const CONTENT_NODE_SERVICE_NAME = 'content-node'
const DISCOVERY_NODE_SERVICE_NAME = 'discovery-node'

// Default timeout for each content node's sync and health check
const CONTENT_NODE_DEFAULT_SELECTION_TIMEOUT = 7500

/**
 * API methods to interact with Audius service providers.
 * Types of services include:
 *    - Content Node (host creator content)
 *    - Discovery Node (index and make content queryable)
 * Retrieving lists of available services, etc. are found here.
 */
class ServiceProvider extends Base {
  /* ------- Content Node  ------- */

  async listCreatorNodes () {
    return this.ethContracts.ServiceProviderFactoryClient.getServiceProviderList(CONTENT_NODE_SERVICE_NAME)
  }

  /**
   * Fetches healthy Content Nodes filtered down to a given whitelist and blacklist
   * @param {Set<string>?} whitelist whether or not to include only specified nodes (default no whiltelist)
   * @param {Set<string?} blacklist whether or not to exclude any nodes (default no blacklist)
   */
  async getSelectableCreatorNodes (
    whitelist = null,
    blacklist = null,
    timeout = CONTENT_NODE_DEFAULT_SELECTION_TIMEOUT
  ) {
    let creatorNodes = await this.listCreatorNodes()

    // Filter whitelist
    if (whitelist) {
      creatorNodes = creatorNodes.filter(node => whitelist.has(node.endpoint))
    }
    // Filter blacklist
    if (blacklist) {
      creatorNodes = creatorNodes.filter(node => !blacklist.has(node.endpoint))
    }

    // Time requests and get version info
    const timings = await timeRequestsAndSortByVersion(
      creatorNodes.map(node => ({
        id: node.endpoint,
        url: `${node.endpoint}/health_check/verbose`
      })),
      timeout
    )

    let services = {}
    timings.forEach(timing => {
      if (timing.response) services[timing.request.id] = timing.response.data.data
    })

    return services
  }

  /**
   * Fetches healthy Content Nodes and autoselects a primary
   * and two secondaries.
   * @param {number} numberOfNodes total number of nodes to fetch (2 secondaries means 3 total)
   * @param {Set<string>?} whitelist whether or not to include only specified nodes (default no whiltelist)
   * @param {Set<string?} blacklist whether or not to exclude any nodes (default no blacklist)
   * @param {boolean} performSyncCheck whether or not to perform sync check
   * @param {number?} timeout ms applied to each request made to a content node
   * @returns { primary, secondaries, services }
   * // primary: string
   * // secondaries: string[]
   * // services: { creatorNodeEndpoint: healthCheckResponse }
   */
  async autoSelectCreatorNodes ({
    numberOfNodes = 3,
    whitelist = null,
    blacklist = null,
    performSyncCheck = true,
    timeout = CONTENT_NODE_DEFAULT_SELECTION_TIMEOUT,
    replicaset = null
  }) {
    const creatorNodeSelection = new CreatorNodeSelection({
      creatorNode: this.creatorNode,
      ethContracts: this.ethContracts,
      numberOfNodes,
      whitelist,
      blacklist,
      timeout,
      replicaSet
    })

    const { primary, secondaries, services } = await creatorNodeSelection.select(performSyncCheck)
    return { primary, secondaries, services }
  }

  /* ------- Discovery Node ------ */

  async listDiscoveryProviders () {
    return this.ethContracts.ServiceProviderFactoryClient.getServiceProviderList(DISCOVERY_NODE_SERVICE_NAME)
  }
}

module.exports = ServiceProvider

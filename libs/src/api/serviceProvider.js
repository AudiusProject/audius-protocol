const { Base } = require('./base')
const { timeRequestsAndSortByVersion } = require('../utils/network')
const CreatorNodeSelection = require('../services/creatorNode/CreatorNodeSelection')

const CREATOR_NODE_SERVICE_NAME = 'content-node'
const DISCOVERY_PROVIDER_SERVICE_NAME = 'discovery-node'

/**
 * API methods to interact with Audius service providers.
 * Types of services include:
 *    - Creator Node (host creator content)
 *    - Discovery Provider (index and make content queryable)
 * Retrieving lists of available services, etc. are found here.
 */
class ServiceProvider extends Base {
  /* ------- CREATOR NODE  ------- */

  async listCreatorNodes () {
    return this.ethContracts.ServiceProviderFactoryClient.getServiceProviderList(CREATOR_NODE_SERVICE_NAME)
  }

  /**
   * Fetches healthy creator nodes filtered down to a given whitelist and blacklist
   * @param {Set<string>?} whitelist whether or not to include only specified nodes (default no whiltelist)
   * @param {Set<string?} blacklist whether or not to exclude any nodes (default no blacklist)
   */
  async getSelectableCreatorNodes (
    whitelist = null,
    blacklist = null
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
        url: `${node.endpoint}/version`
      }))
    )

    let services = {}
    timings.forEach(timing => {
      if (timing.response) services[timing.request.id] = timing.response.data
    })

    return services
  }

  /**
   * Fetches healthy creator nodes, and then autoselects a primary and two secondaries
   * @param {Object} param
   * @param {number} param.[numberOfNodes=3] total number of nodes to fetch (3 = 1 primary, 2 secondaries)
   * @param {Set<string>} param.[whitelist=null] whether or not to include only specified nodes
   * @param {Set<string>} param.[blacklist=null]  whether or not to exclude any nodes
   * @param {boolean} param.[performSyncCheck=true] flag to perform sync check or not
   * @returns { primary, secondaries, services }
   * // primary: string
   * // secondaries: string[]
   * // services: { creatorNodeEndpoint: healthCheckResponse }
   */
  async autoSelectCreatorNodes ({
    numberOfNodes = 3,
    whitelist = null,
    blacklist = null,
    performSyncCheck = true
  }) {
    const creatorNodeSelection = new CreatorNodeSelection({
      creatorNode: this.creatorNode,
      ethContracts: this.ethContracts,
      numberOfNodes,
      whitelist,
      blacklist
    })

    const { primary, secondaries, services } = await creatorNodeSelection.select(performSyncCheck)
    return { primary, secondaries, services }
  }

  /* ------- DISCOVERY PROVIDER ------ */

  async listDiscoveryProviders () {
    return this.ethContracts.ServiceProviderFactoryClient.getServiceProviderList(DISCOVERY_PROVIDER_SERVICE_NAME)
  }
}

module.exports = ServiceProvider

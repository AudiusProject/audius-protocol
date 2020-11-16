const { Base } = require('./base')
const { timeRequestsAndSortByVersion } = require('../utils/network')
const CreatorNodeSelection = require('../services/creatorNode/CreatorNodeSelection')

const CREATOR_NODE_SERVICE_NAME = 'content-node'
const DISCOVERY_PROVIDER_SERVICE_NAME = 'discovery-provider'

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
        url: `${node.endpoint}/health_check`
      }))
    )

    let services = {}
    timings.forEach(timing => {
      if (timing.response) services[timing.request.id] = timing.response.data
    })

    return services
  }

  /**
   * Fetches healthy creator nodes and autoselects a primary
   * and two secondaries
   * @param {number} numberOfNodes total number of nodes to fetch (2 secondaries means 3 total)
   * @param {Set<string>?} whitelist whether or not to include only specified nodes (default no whiltelist)
   * @param {Set<string?} blacklist whether or not to exclude any nodes (default no blacklist)
   * @returns { primary, secondaries, services }
   * // primary: string
   * // secondaries: Array<string>
   * // services: { creatorNodeEndpoint: versionInfo }
   */
  async autoSelectCreatorNodes (
    numberOfNodes = 3,
    whitelist = null,
    blacklist = null
  ) {
    const creatorNodeSelection = new CreatorNodeSelection({
      creatorNode: this.creatorNode,
      ethContracts: this.ethContracts,
      numberOfNodes,
      whitelist,
      blacklist
    })

    const { primary, secondaries, services } = await creatorNodeSelection.select()
    return { primary, secondaries, services }
  }

  /* ------- DISCOVERY PROVIDER ------ */

  async listDiscoveryProviders () {
    return this.ethContracts.ServiceProviderFactoryClient.getServiceProviderList(DISCOVERY_PROVIDER_SERVICE_NAME)
  }
}

module.exports = ServiceProvider

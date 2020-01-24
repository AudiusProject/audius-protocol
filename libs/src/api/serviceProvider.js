const _ = require('lodash')
const { Base } = require('./base')
const Utils = require('../utils')

const CREATOR_NODE_SERVICE_NAME = 'creator-node'
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
    let timings = (await Promise.all(
      creatorNodes.map(async node => {
        let resp
        const request = {
          id: node.endpoint,
          url: `${node.endpoint}/version`
        }
        try {
          resp = await Utils.timeRequest(request)
        } catch (e) {
          resp = false
        }
        return resp
      })
    )).filter(Boolean)
    timings = timings.sort((a, b) => a.millis - b.millis)

    let services = {}
    timings.forEach(timing => {
      services[timing.request.id] = timing.response.data
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
    blacklist = null,
    enforceSyncStatus = true
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

    // Get sync status for all nodes and filter out unhealthy (unresponsive) nodes.
    const healthyCreatorNodesSyncStatus = {}
    await Promise.all(
      creatorNodes.map(async node => {
        try {
          const syncStatus = await this.creatorNode.getSyncStatus(node.endpoint)
          healthyCreatorNodesSyncStatus[node.endpoint] = syncStatus
        } catch (e) {
          // Ignore unhealthy nodes.
          console.error(`get sync status failed ${node.endpoint}`)
        }
      })
    )
    const healthyCreatorNodes = Object.keys(healthyCreatorNodesSyncStatus)

    // Time requests and autoselect nodes.
    const timings = await Utils.timeRequests(
      healthyCreatorNodes.map(node => ({
        id: node,
        url: `${node}/version`
      }))
    )

    // Nodes version info object.
    let services = {}
    timings.forEach(timing => {
      services[timing.request.id] = timing.response.data
    })

    let primaryOptions = timings
    if (enforceSyncStatus) {
      // Select primary that is either unconfigured or configured & notBehind
      primaryOptions = timings.filter(timingResp => {
        const syncStatus = healthyCreatorNodesSyncStatus[timingResp.request.id]
        return !(syncStatus.isConfigured && syncStatus.isBehind)
      })
    }
    const primary = primaryOptions[0] ? primaryOptions[0].request.id : null

    // Select secondaries randomly.
    // TODO: Implement geolocation-based selection
    const secondaries = _.sampleSize(timings.slice(1), numberOfNodes - 1)
      .map(timing => timing.request.id)

    return { primary, secondaries, services }
  }

  /* ------- DISCOVERY PROVIDER ------ */

  async listDiscoveryProviders () {
    return this.ethContracts.ServiceProviderFactoryClient.getServiceProviderList(DISCOVERY_PROVIDER_SERVICE_NAME)
  }
}

module.exports = ServiceProvider

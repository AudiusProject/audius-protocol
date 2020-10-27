const axios = require('axios')
const semver = require('semver')

const ServiceSelection = require('../../service-selection/ServiceSelection')
const { CREATOR_NODE_SERVICE_NAME } = require('./constants')

class CreatorNodeSelection extends ServiceSelection {
  constructor ({ creatorNode, numberOfNodes, ethContracts, whitelist, blacklist }) {
    super({
      getServices: async () => {
        this.currentVersion = await ethContracts.getCurrentVersion(CREATOR_NODE_SERVICE_NAME)
        const services = await this.ethContracts.getServiceProviderList(CREATOR_NODE_SERVICE_NAME)
        return services.map(e => e.endpoint) // ? might need to map like services.map(e => e.endpoint)
      },
      whitelist
    })
    this.creatorNode = creatorNode
    this.numberOfNodes = numberOfNodes
    this.ethContracts = ethContracts
    this.blacklist = blacklist

    // List of valid past creator node versions registered on chain
    this.validVersions = null
  }

  /**
   * Selects a primary and secondary creator nodes
   *
   * 1. Retrieve all the creator node services
   * 2. Filter from/out creator nodes based off of the whitelist and blacklist
   * 3. Init a map of default stats of each service
   * 4. Perform a health check and sync status check to determine health and update stats
   * 5. Sort by healthiest (highest version -> lowest version; secondary check if equal version based off of responseTime)
   * 6. Select a primary and numberOfNodes-1 number of secondaries
   */
  async select () {
    // Reset decision tree
    this.decisionTree = []

    // Get all the creator node endpoints on chain and filter
    let services = await this.getServices()
    this.decisionTree.push({ stage: 'Get All Services', val: services })

    if (this.whitelist && this.whitelist.length > 0) {
      services = this.filterToWhitelist(services)
      this.decisionTree.push({ stage: 'Filtered To Whitelist', val: services })
    }

    if (this.blacklist && this.blacklist.length > 0) {
      services = this.filterFromBlacklist(services)
      this.decisionTree.push({ stage: 'Filtered From Blacklist', val: services })
    }

    // Init map of creator node endpoints and their default stats
    const map = {}
    services.map(service => {
      map[service] = {
        version: null,
        healthCheckEndpoint: `${service}/health_check`,
        healthCheckResponseTime: null,
        isHealthy: false,
        isBehind: true,
        isConfigured: false,
        geographicData: {}
        // todo: add other criteria we should evaluate like diskUsage, currentNumberOfRequests
      }
    })

    const healthyEndpoints = []
    const healthyServices = []
    for (const service of services) {
      const start = Date.now()
      try {
        // Check health and sync status, and then update stats per service
        let healthCheckResp = await axios({
          method: 'get',
          url: map[service].healthCheckEndpoint
        })
        healthCheckResp = healthCheckResp.data.data

        map[service].healthCheckResponseTime = Date.now() - start
        map[service].version = healthCheckResp.version
        const { isBehind, isConfigured } = await this.creatorNode.getSyncStatus(service)
        map[service].isBehind = isBehind
        map[service].isConfigured = isConfigured
        map[service].geographicData = {
          country: healthCheckResp.country,
          latitude: healthCheckResp.latitude,
          longitude: healthCheckResp.longitude
        }

        // If service is not configured, behind in blocks, or its major + minor version is behind, mark as unhealthy
        map[service].isHealthy = isConfigured && !isBehind &&
          this.ethContracts.hasSameMajorAndMinorVersion(this.currentVersion, healthCheckResp.version)

        // Add to healthyServices list; used and sorted to select primary and secondaries
        if (map[service].isHealthy) {
          healthyEndpoints.push(service)
          healthyServices.push({ endpoint: service, version: map[service].version, responseTime: map[service].healthCheckResponseTime })
        }
      } catch (e) {
        console.error(`CreatorNodeSelection - Error with checking ${service} health: ${e}`)
      }
    }
    this.decisionTree.push({ stage: 'Filtered Out Known Unhealthy', val: healthyEndpoints })

    // Prioritize higher versions for selected creator nodes
    this.sortBySemver(healthyServices)

    // Index 0 of healthyServices will be the most optimal creator node candidate
    const primary = healthyServices[0] ? healthyServices[0].endpoint : null

    // Index 1 to n of healthyServices will be sorted in highest version -> lowest version
    // Return up to numberOfNodes-1 of secondaries that is not null and not the primary
    let numSecondariesReturned = 0
    const secondaries = healthyServices
      .filter(service =>
        service && service.endpoint !== primary && numSecondariesReturned++ < this.numberOfNodes
      )
      .map(service => service.endpoint)

    this.decisionTree.push({ stage: 'Made A Selection of a Primary and Secondaries', val: { primary, secondaries: secondaries.toString() } })

    console.info('CreatorNodeSelection - final decision tree state', this.decisionTree)

    // not sure about the structure of services
    return { primary, secondaries, services: map }
  }

  /**
   * Sort by highest version number. If the compared services are of the same, sort by
   * its response time.
   * @param {[{endpoint, version, responseTime}]} services
   */
  sortBySemver (services) {
    services.sort((a, b) => {
      if (semver.gt(a.version, b.version)) return -1
      if (semver.lt(a.version, b.version)) return 1

      return a.responseTime - b.responseTime
    })
    return services
  }

  /**
   * Filter out services that are in the blacklist
   * @param {[string]} services endpoints
   */
  filterFromBlacklist (services) {
    return services.filter(s => !this.blacklist.has(s))
  }
}

module.exports = CreatorNodeSelection

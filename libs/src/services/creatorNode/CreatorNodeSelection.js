const semver = require('semver')

const ServiceSelection = require('../../service-selection/ServiceSelection')
const { timeRequest } = require('../../utils/network')
const { CREATOR_NODE_SERVICE_NAME } = require('./constants')

class CreatorNodeSelection extends ServiceSelection {
  constructor ({ creatorNode, numberOfNodes, ethContracts, whitelist, blacklist }) {
    super({
      getServices: async () => {
        this.currentVersion = await ethContracts.getCurrentVersion(CREATOR_NODE_SERVICE_NAME)
        const services = await this.ethContracts.getServiceProviderList(CREATOR_NODE_SERVICE_NAME)
        return services.map(e => e.endpoint)
      },
      whitelist
    })
    this.creatorNode = creatorNode
    this.numberOfNodes = numberOfNodes
    this.ethContracts = ethContracts
    this.blacklist = blacklist
    // Services with the structure {request, response, millis} (see timeRequest) sorted by semver and response time
    this.healthCheckedServicesList = []

    // List of valid past creator node versions registered on chain
    this.validVersions = null
  }

  /**
   * Selects a primary and secondary creator nodes
   *
   * 1. Retrieve all the creator node services
   * 2. Filter from/out creator nodes based off of the whitelist and blacklist
   * 3. Filter out unhealthy, outdated, and still syncing nodes via health and sync check
   * 4. Sort by healthiest (highest version -> lowest version); secondary check if equal version based off of responseTime)
   * 5. Select a primary and numberOfNodes-1 number of secondaries (most likely 2) either from available nodes or backups
   */
  async select () {
    // Reset decision tree and backups
    this.decisionTree = []
    this.clearBackups()

    // Get all the creator node endpoints on chain and filter
    let services = await this.getServices()
    this.decisionTree.push({ stage: 'Get All Services', val: services })

    if (this.whitelist && this.whitelist.length > 0) { services = this.filterToWhitelist(services) }
    this.decisionTree.push({ stage: 'Filtered To Whitelist', val: services })

    if (this.blacklist && this.blacklist.length > 0) { services = this.filterFromBlacklist(services) }
    this.decisionTree.push({ stage: 'Filtered Out From Blacklist', val: services })

    const healthCheckedServices = await this.timeRequests(
      services.map(node => ({
        id: node,
        url: `${node}/health_check`
      }))
    )
    // Store a copy of the sorted by version and resposne time nodes
    this.healthCheckedServicesList = healthCheckedServices

    const healthyServices = healthCheckedServices.filter(resp => {
      const endpoint = resp.request.id

      // Add everything as backup regardless of response
      this.addBackup(endpoint, resp.response)

      let isHealthy = false
      if (resp.response) {
        const isUp = resp.response.status === 200
        const versionIsUpToDate = this.ethContracts.hasSameMajorAndMinorVersion(this.currentVersion, resp.response.data.data.version)
        isHealthy = isUp && versionIsUpToDate
      }

      // If not healthy, remove as backup and add to unhealthy
      if (!isHealthy) {
        this.removeFromBackups(endpoint)
        this.addUnhealthy(endpoint)
      }
      return isHealthy
    })
    services = healthyServices.map(service => service.request.id)

    this.decisionTree.push({ stage: 'Filtered Out Known Unhealthy And Outdated Nodes', val: services })

    const successfulSyncCheckServices = []
    for (const service of services) {
      let status
      try {
        status = await this.creatorNode.getSyncStatus(service)
      } catch (e) {
        // Error with checking sync status -- deem current service as unhealthy
        console.warn(`CreatorNodeSelection - Err with checking sync status for ${service}: ${e}`)
        this.removeFromBackups(service)
        this.addUnhealthy(service)
        continue
      }

      const { isBehind, isConfigured } = status

      // a first time creator will have a sync status as isBehind = true and isConfiugred = false. this is ok
      const firstTimeCreator = isBehind && !isConfigured
      // an existing creator will have a sync status (assuming healthy) as isBehind = false and isConfigured = true. this is also ok
      const existingCreator = !isBehind && isConfigured
      // if neither of these two are true, the cnode is not suited to be selected
      if (firstTimeCreator || existingCreator) successfulSyncCheckServices.push(service)
    }
    services = [...successfulSyncCheckServices]
    this.decisionTree.push({ stage: 'Filtered Out Based On Sync Status', val: services })

    await this.removePotentialPrimariesFromBackups(services)

    const primary = this.getPrimary(services)
    const secondaries = this.getSecondaries(services, primary)
    this.decisionTree.push({ stage: 'Made A Selection of a Primary and Secondaries', val: { primary, secondaries: secondaries.toString() } })

    console.info('CreatorNodeSelection - final decision tree state', this.decisionTree)

    return { primary, secondaries, services: healthCheckedServices }
  }

  /**
   * Since all candidates are added as a backup, remove services that cleared the health
   * check and sync status check from backups. This will prevent duplicate services from
   * getting chosen as a backup.
   * @param {[string]} services
   */
  async removePotentialPrimariesFromBackups (services) {
    Promise.all(services.map(service => {
      this.removeFromBackups(service)
      return Promise.resolve()
    }))
  }

  /**
   * Fetches multiple urls and times each request and returns the results sorted by
   * lowest-latency.
   * @param {Array<Object>} requests [{id, url}, {id, url}]
   * @returns { Array<{url, response, millis}> }
   */
  async timeRequests (requests) {
    let timings = await Promise.all(requests.map(async request =>
      timeRequest(request)
    ))

    this.sortBySemver(timings)
    return timings
  }

  /**
   * Sort by highest version number. If the compared services are of the same version, sort by
   * its response time.
   * @param {{ request ({url: 'get_request_url'}), response (axios response), millis (ms)}} services
   */
  sortBySemver (services) {
    services.sort((a, b) => {
      try {
        if (semver.gt(a.response.data.data.version, b.response.data.data.version)) return -1
        if (semver.lt(a.response.data.data.version, b.response.data.data.version)) return 1
      } catch (e) {
        // Unable to sort by version -- probably failed health check. Send to the back
        if (!a.response) return 1
        if (!b.response) return -1
      }

      // If same version, do a tie breaker on the response time
      return a.millis - b.millis
    })
  }

  getPrimary (services) {
    // Index 0 of services will be the most optimal creator node candidate
    // Select 1 from healthy services
    let primary = services[0]
    // All nodes are stored as backup unless unhealthy. Once chosen, remove from backups

    // If no healthy services available, select from backups
    if (!primary) {
      primary = this.selectFromBackups()
    }

    // If no backups available, select from unhealthy
    if (!primary) {
      primary = this.selectFromUnhealthy()
    }

    return primary
  }

  getSecondaries (services, primary) {
    // Index 1 to n of services will be sorted in highest version -> lowest version
    // Select up to numberOfNodes-1 of secondaries that is not null and not the primary
    let remainingSecondaries = this.numberOfNodes - 1
    const secondaries = services
      .filter(service => {
        const validSecondary = service && service !== primary && remainingSecondaries-- > 0
        return validSecondary
      })

    // If not enough secondaries returned from services, select from backups
    remainingSecondaries = this.numberOfNodes - 1 - secondaries.length
    while (remainingSecondaries-- > 0) {
      const backup = this.selectFromBackups()
      if (backup && backup !== primary) secondaries.push(backup)
    }

    // If not enough secondaries returned from backups, select from unhealthy
    remainingSecondaries = this.numberOfNodes - 1 - secondaries.length
    while (remainingSecondaries-- > 0) {
      const unhealthy = this.selectFromUnhealthy()
      if (unhealthy && unhealthy !== primary) secondaries.push(unhealthy)
    }

    return secondaries
  }

  /**
   * `healthCheckedServicesList` will be the list of services that have undergone a health check, and
   * sorted by descending semver and ascending response time. Thus, it is in the service selection's best
   * interest to pick a backup from the start of the list.
   *
   * Iterate through `healthCheckedServicesList` and if there is a hit in `backups`, remove the service
   * from backups to prevent it from getting picked again and return it.
   */
  selectFromBackups () {
    for (const service of this.healthCheckedServicesList) {
      const endpoint = service.request.id
      if (this.backups.hasOwnProperty(endpoint)) {
        this.removeFromBackups(endpoint)
        return endpoint
      }
    }
  }

  /**
   * If everything is truly unhealthy (ruh roh), select from unhealthy. Similar logic to
   * `selectFromBackups`,
   */
  selectFromUnhealthy () {
    for (const service of this.healthCheckedServicesList) {
      const endpoint = service.request.id
      if (this.unhealthy.has(endpoint)) {
        this.removeFromUnhealthy(endpoint)
        return endpoint
      }
    }
  }
}

module.exports = CreatorNodeSelection

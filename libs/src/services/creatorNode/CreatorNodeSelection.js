// const semver = require('semver')

const ServiceSelection = require('../../service-selection/ServiceSelection')
const { timeRequestsAndSortByVersion } = require('../../utils/network')
const { CREATOR_NODE_SERVICE_NAME } = require('./constants')

class CreatorNodeSelection extends ServiceSelection {
  constructor ({ creatorNode, numberOfNodes, ethContracts, whitelist, blacklist }) {
    super({
      getServices: async () => {
        this.currentVersion = await ethContracts.getCurrentVersion(CREATOR_NODE_SERVICE_NAME)
        const services = await this.ethContracts.getServiceProviderList(CREATOR_NODE_SERVICE_NAME)
        return services.map(e => e.endpoint)
      },
      whitelist,
      blacklist
    })
    this.creatorNode = creatorNode
    this.numberOfNodes = numberOfNodes
    this.ethContracts = ethContracts
    // Services with the structure {request, response, millis} (see timeRequest) sorted by semver and response time
    this.healthCheckedServicesList = []

    // List of valid past creator node versions registered on chain
    this.validVersions = null

    this.state = Object.freeze({
      GET_ALL_SERVICES: 'GET ALL SERVICES',
      FILTERED_TO_WHITELIST: 'FILTERED TO WHITELIST',
      FILTERED_FROM_BLACKLIST: 'FILTERED FROM BLACKLIST',
      FILTERED_OUT_UNHEALTHY_AND_OUTDATED: 'FILTERED OUT UNHEALTHY AND OUTDATED',
      FILTERED_OUT_SYNC_IN_PROGRESS: 'FILTERED OUT SYNC IN PROGRESS',
      SELECTED_PRIMARY_AND_SECONDARIES: 'SELECTED PRIMARY AND SECONDARIES'
    })
  }

  /**
   * Selects a primary and secondary creator nodes. Order of preference is highest version, then response time.
   *
   * 1. Retrieve all the creator node services
   * 2. Filter from/out creator nodes based off of the whitelist and blacklist
   * 3. Filter out unhealthy, outdated, and still syncing nodes via health and sync check
   * 4. Sort by healthiest (highest version -> lowest version); secondary check if equal version based off of responseTime
   * 5. Select a primary and numberOfNodes-1 number of secondaries (most likely 2) either from available nodes or backups
   */
  async select () {
    // Reset decision tree and backups
    this.decisionTree = []
    this.clearBackups()

    // Get all the creator node endpoints on chain and filter
    let services = await this.getServices()
    this.decisionTree.push({ stage: this.state.GET_ALL_SERVICES, val: services })

    if (this.whitelist) { services = this.filterToWhitelist(services) }
    this.decisionTree.push({ stage: this.state.FILTERED_TO_WHITELIST, val: services })

    if (this.blacklist) { services = this.filterFromBlacklist(services) }
    this.decisionTree.push({ stage: this.state.FILTERED_FROM_BLACKLIST, val: services })

    const healthCheckedServices = await timeRequestsAndSortByVersion(
      services.map(node => ({
        id: node,
        url: `${node}/health_check`
      }))
    )

    // Store a copy of the sorted by version and response time nodes
    this.healthCheckedServicesList = healthCheckedServices

    const healthyServices = healthCheckedServices.filter(resp => {
      const endpoint = resp.request.id
      let isHealthy = false
      if (resp.response) {
        const isUp = resp.response.status === 200
        const versionIsUpToDate = this.ethContracts.hasSameMajorAndMinorVersion(
          this.currentVersion,
          resp.response.data.data.version
        )
        isHealthy = isUp && versionIsUpToDate
      }

      // If not healthy, add to unhealthy. Else, add as backup
      if (!isHealthy) {
        this.addUnhealthy(endpoint)
      } else {
        this.addBackup(endpoint, resp.response)
      }

      return isHealthy
    })
    services = healthyServices.map(service => service.request.id)
    this.decisionTree.push({ stage: this.state.FILTERED_OUT_UNHEALTHY_AND_OUTDATED, val: services })

    const successfulSyncCheckServices = []
    const syncResponses = await Promise.all(services.map(service => this.getSyncStatus(service)))
    syncResponses.forEach(response => {
      if (response.error) {
        console.warn(`CreatorNodeSelection - Failed sync status check for ${response.service}: ${response.e}`)
        this.removeFromBackups(response.service)
        this.addUnhealthy(response.service)
      }

      const { isBehind, isConfigured } = response.syncStatus
      // a first time creator will have a sync status as isBehind = true and isConfiugred = false. this is ok
      const firstTimeCreator = isBehind && !isConfigured
      // an existing creator will have a sync status (assuming healthy) as isBehind = false and isConfigured = true. this is also ok
      const existingCreator = !isBehind && isConfigured
      // if neither of these two are true, the cnode is not suited to be selected
      if (firstTimeCreator || existingCreator) successfulSyncCheckServices.push(response.service)
    })

    services = [...successfulSyncCheckServices]
    this.decisionTree.push({ stage: this.state.FILTERED_OUT_SYNC_IN_PROGRESS, val: services })

    const primary = this.getPrimary(services)
    const secondaries = this.getSecondaries(services, primary)
    this.decisionTree.push({
      stage: this.state.SELECTED_PRIMARY_AND_SECONDARIES,
      val: { primary, secondaries: secondaries.toString() }
    })

    console.info('CreatorNodeSelection - final decision tree state', this.decisionTree)

    return { primary, secondaries, services: healthCheckedServices }
  }

  /**
   * Checks the sync progress of a creator node
   * @param {string} service creator node endopint
   */
  async getSyncStatus (service) {
    try {
      const syncStatus = await this.creatorNode.getSyncStatus(service)
      return { service, syncStatus, error: null }
    } catch (e) {
      return { service, syncStatus: null, error: e }
    }
  }

  /**
   * Select a primary creator node
   * @param {string[]} services all healthy creator node endpoints
   */
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

  /**
   * Selects secondary creator nodes
   * @param {string[]} services all healthy creator node endpoints
   * @param {string} primary the chosen primary
   */
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

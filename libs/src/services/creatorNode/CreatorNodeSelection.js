const ServiceSelection = require('../../service-selection/ServiceSelection')
const { timeRequestsAndSortByVersion } = require('../../utils/network')
const { CREATOR_NODE_SERVICE_NAME, DECISION_TREE_STATE } = require('./constants')

/**
 * In memory dictionary used to query spID from endpoint
 * Eliminates duplicate web3 calls within same session
 */
let contentNodeEndpointToSpID = { }
function getSpIDForEndpoint (endpoint) {
  return contentNodeEndpointToSpID[endpoint]
}

function setSpIDForEndpoint (endpoint, spID) {
  contentNodeEndpointToSpID[endpoint] = spID
}

class CreatorNodeSelection extends ServiceSelection {
  constructor ({
    creatorNode,
    numberOfNodes,
    ethContracts,
    whitelist,
    blacklist,
    maxStorageUsedPercent = 95,
    timeout = null
  }) {
    super({
      getServices: async () => {
        this.currentVersion = await ethContracts.getCurrentVersion(CREATOR_NODE_SERVICE_NAME)
        const services = await this.ethContracts.getServiceProviderList(CREATOR_NODE_SERVICE_NAME)
        return services.map((e) => {
          setSpIDForEndpoint(e.endpoint, e.spID)
          return e.endpoint
        })
      },
      // Use the content node's configured whitelist if not provided
      whitelist: whitelist || (creatorNode && creatorNode.passList),
      blacklist: blacklist || (creatorNode && creatorNode.blockList)
    })
    this.creatorNode = creatorNode
    this.numberOfNodes = numberOfNodes
    this.ethContracts = ethContracts
    this.timeout = timeout
    this.healthCheckPath = 'health_check/verbose'
    // String array of healthy Content Node endpoints
    this.backupsList = []
    // Max percentage (represented out of 100) allowed before determining CN is unsuitable for selection
    this.maxStorageUsedPercent = maxStorageUsedPercent
  }

  /**
   * Selects a primary and secondary Content Nodes. Order of preference is highest version, then response time.
   *
   * 1. Retrieve all the Content Node services
   * 2. Filter from/out Content Nodes based off of the whitelist and blacklist
   * 3. Filter out unhealthy, outdated, and still syncing nodes via health and sync check
   * 4. Sort by healthiest (highest version -> lowest version); secondary check if equal version based off of responseTime
   * 5. Select a primary and numberOfNodes-1 number of secondaries (most likely 2) from backups
   * @param {boolean?} performSyncCheck whether or not to check whether the nodes need syncs before selection
   */
  async select (performSyncCheck = true, log = true) {
    // Reset decision tree and backups
    this.decisionTree = []
    this.clearBackups()
    this.clearUnhealthy()

    // Get all the Content Node endpoints on chain and filter
    let services = await this.getServices()
    this.decisionTree.push({ stage: DECISION_TREE_STATE.GET_ALL_SERVICES, val: services })

    if (this.whitelist) { services = this.filterToWhitelist(services) }
    this.decisionTree.push({ stage: DECISION_TREE_STATE.FILTER_TO_WHITELIST, val: services })

    if (this.blacklist) { services = this.filterFromBlacklist(services) }
    this.decisionTree.push({ stage: DECISION_TREE_STATE.FILTER_FROM_BLACKLIST, val: services })

    // TODO: add a sample size selection round to not send requests to all available nodes

    if (performSyncCheck) { services = await this._performSyncChecks(services, this.timeout) }
    const { healthyServicesList, healthyServicesMap: servicesMap } = await this._performHealthChecks(services)
    services = healthyServicesList

    // Set index 0 from services as the primary
    const primary = this.getPrimary(services)
    // Set index 1 - services.length as the backups. Used in selecting secondaries
    this.setBackupsList(services.slice(1))
    const secondaries = this.getSecondaries()
    this.decisionTree.push({
      stage: DECISION_TREE_STATE.SELECT_PRIMARY_AND_SECONDARIES,
      val: { primary, secondaries: secondaries.toString(), services: Object.keys(servicesMap).toString() }
    })

    if (log) {
      console.info('CreatorNodeSelection - final decision tree state', this.decisionTree)
    }
    return { primary, secondaries, services: servicesMap }
  }

  /**
   * Checks the sync progress of a Content Node
   * @param {string} service Content Node endopint
   * @param {number?} timeout ms
   */
  async getSyncStatus (service, timeout = null) {
    try {
      const syncStatus = await this.creatorNode.getSyncStatus(service, timeout)
      return { service, syncStatus, error: null }
    } catch (e) {
      return { service, syncStatus: null, error: e }
    }
  }

  /**
   * Sets backupsList to input
   * @param {string[]} services string array of Content Node endpoints
   */
  setBackupsList (services) {
    // Rest of services that are not selected as the primary are valid backups. Add as backup
    // This backups list will also be in order of descending highest version/fastest
    this.backupsList = services
  }

  /**
   * Get backups in the form of an array
   */
  getBackupsList () {
    return this.backupsList
  }

  /**
   * Select a primary Content Node
   * @param {string[]} services all healthy Content Node endpoints
   */
  getPrimary (services) {
    // Index 0 of services will be the most optimal Content Node candidate
    return services[0]
  }

  /**
   * Selects secondary Content Nodes
   */
  getSecondaries () {
    // Index 1 to n of services will be sorted in highest version -> lowest version
    // Select up to numberOfNodes-1 of secondaries
    const backups = this.getBackupsList()
    const secondaries = backups.slice(0, this.numberOfNodes - 1)

    return secondaries
  }

  /**
   * Performs a sync check for every endpoint in services. Returns an array of successful sync checked endpoints and
   * adds the err'd sync checked endpoints to this.unhealthy
   * @param {string[]} services content node endpoints
   * @param {number?} timeout ms applied to each request
   */
  async _performSyncChecks (services, timeout = null) {
    const successfulSyncCheckServices = []
    const syncResponses = await Promise.all(services.map(service => this.getSyncStatus(service, timeout)))
    // Perform sync checks on all services
    for (const response of syncResponses) {
      // Could not perform a sync check. Add to unhealthy
      if (response.error) {
        console.warn(`CreatorNodeSelection - Failed sync status check for ${response.service}: ${response.error}`)
        this.addUnhealthy(response.service)
        continue
      }

      const { isBehind, isConfigured } = response.syncStatus
      // a first time creator will have a sync status as isBehind = true and isConfigured = false. this is ok
      const firstTimeCreator = isBehind && !isConfigured
      // an existing creator will have a sync status (assuming healthy) as isBehind = false and isConfigured = true. this is also ok
      const existingCreator = !isBehind && isConfigured
      // if either of these two are true, the cnode is suited to be selected
      if (firstTimeCreator || existingCreator) {
        successfulSyncCheckServices.push(response.service)
      } else {
        // else, add to unhealthy
        this.addUnhealthy(response.service)
      }
    }

    this.decisionTree.push({
      stage: DECISION_TREE_STATE.FILTER_OUT_SYNC_IN_PROGRESS,
      val: successfulSyncCheckServices
    })

    return successfulSyncCheckServices
  }

  /**
   * Performs a health check for every endpoint in services. Returns an array of successful health checked endpoints and
   * adds the err'd health checked endpoints to this.unhealthy, and a mapping of successful endpoint to its health check response.
   * @param {string[]} services content node endpoints
   */
  async _performHealthChecks (services) {
    // Perform a health check on services that passed the sync checks
    const healthCheckedServices = await timeRequestsAndSortByVersion(
      services.map(node => ({
        id: node,
        url: `${node}/${this.healthCheckPath}`
      })),
      this.timeout
    )

    const healthyServices = healthCheckedServices.filter(resp => {
      const endpoint = resp.request.id
      let isHealthy = false

      // Check that the health check:
      // 1. Responded with status code 200
      // 2. Version is up to date on major and minor
      // 3. Has enough storage space
      //    - Max capacity percent is defined from CN health check response. If not present,
      //      use existing value from `this.maxStorageUsedPercent`
      if (resp.response) {
        const isUp = resp.response.status === 200
        const versionIsUpToDate = this.ethContracts.hasSameMajorAndMinorVersion(
          this.currentVersion,
          resp.response.data.data.version
        )
        let { storagePathSize, storagePathUsed, maxStorageUsedPercent } = resp.response.data.data
        if (maxStorageUsedPercent) {
          this.maxStorageUsedPercent = maxStorageUsedPercent
        } else {
          console.warn(`maxStorageUsedPercent not found in health check response. Using constructor value of ${this.maxStorageUsedPercent}% as maxStorageUsedPercent.`)
        }
        const hasEnoughStorage = this._hasEnoughStorageSpace({ storagePathSize, storagePathUsed })
        isHealthy = isUp && versionIsUpToDate && hasEnoughStorage
      }

      if (!isHealthy) { this.addUnhealthy(endpoint) }

      return isHealthy
    })

    // Create a mapping of healthy services and their responses. Used on dapp to display the healthy services for selection
    // Also update services to be healthy services
    let servicesMap = {}
    const healthyServicesList = healthyServices.map(service => {
      servicesMap[service.request.id] = service.response.data
      return service.request.id
    })

    this.decisionTree.push({ stage: DECISION_TREE_STATE.FILTER_OUT_UNHEALTHY_OUTDATED_AND_NO_STORAGE_SPACE, val: healthyServicesList })

    // Record metrics
    if (this.creatorNode && this.creatorNode.monitoringCallbacks.healthCheck) {
      healthCheckedServices.forEach(check => {
        if (check.response && check.response.data) {
          const url = new URL(check.request.url)
          const data = check.response.data.data
          try {
            this.creatorNode.monitoringCallbacks.healthCheck({
              endpoint: url.origin,
              pathname: url.pathname,
              queryString: url.queryrString,
              version: data.version,
              git: data.git,
              selectedDiscoveryNode: data.selectedDiscoveryProvider,
              databaseSize: data.databaseSize,
              databaseConnections: data.databaseConnections,
              totalMemory: data.totalMemory,
              usedMemory: data.usedMemory,
              totalStorage: data.storagePathSize,
              usedStorage: data.storagePathUsed,
              maxFileDescriptors: data.maxFileDescriptors,
              allocatedFileDescriptors: data.allocatedFileDescriptors,
              receivedBytesPerSec: data.receivedBytesPerSec,
              transferredBytesPerSec: data.transferredBytesPerSec
            })
          } catch (e) {
            // Swallow errors -- this method should not throw generally
            console.error(e)
          }
        }
      })
    }

    return { healthyServicesList, healthyServicesMap: servicesMap }
  }

  _hasEnoughStorageSpace ({ storagePathSize, storagePathUsed }) {
    // If for any reason these values off the response is falsy value, default to enough storage
    if (
      storagePathSize === null ||
      storagePathSize === undefined ||
      storagePathUsed === null ||
      storagePathUsed === undefined
    ) { return true }

    return (100 * storagePathUsed / storagePathSize) < this.maxStorageUsedPercent
  }
}

module.exports = {
  CreatorNodeSelection,
  getSpIDForEndpoint,
  setSpIDForEndpoint
}

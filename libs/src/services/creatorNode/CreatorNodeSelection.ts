import type { AxiosResponse } from 'axios'
import _ from 'lodash'
import type { EthContracts } from '../ethContracts'

import {
  ServiceSelection,
  ServiceSelectionConfig
} from '../../service-selection'
import {
  timeRequests,
  sortServiceTimings,
  ServiceName,
  Timing,
  Logger
} from '../../utils'
import { CREATOR_NODE_SERVICE_NAME, DECISION_TREE_STATE } from './constants'
import type { MonitoringCallbacks } from '../types'

type Timeout = number | null

/**
 * In memory dictionary used to query spID from endpoint
 * Eliminates duplicate web3 calls within same session
 */
const contentNodeEndpointToSpID: Record<string, number | undefined> = {}

export function getSpIDForEndpoint(endpoint: string) {
  return contentNodeEndpointToSpID[endpoint]
}

export function setSpIDForEndpoint(endpoint: string, spID?: number) {
  contentNodeEndpointToSpID[endpoint] = spID
}

type CreatorNode = {
  getSyncStatus: (
    service: ServiceName,
    timeout: Timeout
  ) => Promise<{ isBehind: boolean; isConfigured: boolean }>
  passList: Set<string> | null
  blockList: Set<string> | null
  monitoringCallbacks: MonitoringCallbacks
}

type CreatorNodeSelectionConfig = Omit<
  ServiceSelectionConfig,
  'getServices'
> & {
  creatorNode: CreatorNode
  numberOfNodes: number
  ethContracts: EthContracts
  maxStorageUsedPercent?: number
  timeout?: Timeout
  equivalencyDelta?: number | null
  preferHigherPatchForPrimary?: boolean
  preferHigherPatchForSecondaries?: boolean
  logger?: Logger
}

interface Decision {
  stage: DECISION_TREE_STATE
  val?: unknown
}

export class CreatorNodeSelection extends ServiceSelection {
  override decisionTree: Decision[]
  currentVersion: string | null = ''
  ethContracts: EthContracts
  creatorNode: CreatorNode
  numberOfNodes: number
  timeout: Timeout
  equivalencyDelta: number | null
  preferHigherPatchForPrimary: boolean
  preferHigherPatchForSecondaries: boolean
  healthCheckPath: string
  backupsList: string[]
  backupTimings: Timing[]
  maxStorageUsedPercent: number
  logger: Logger

  constructor({
    creatorNode,
    numberOfNodes,
    ethContracts,
    whitelist,
    blacklist,
    logger = console,
    maxStorageUsedPercent = 95,
    timeout = null,
    equivalencyDelta = null,
    preferHigherPatchForPrimary = true,
    preferHigherPatchForSecondaries = true
  }: CreatorNodeSelectionConfig) {
    super({
      getServices: async () => {
        this.currentVersion = await ethContracts.getCurrentVersion(
          CREATOR_NODE_SERVICE_NAME
        )
        const services = await this.ethContracts.getServiceProviderList(
          CREATOR_NODE_SERVICE_NAME
        )
        return services.map((e) => {
          setSpIDForEndpoint(e.endpoint, e.spID)
          return e.endpoint
        })
      },
      // Use the content node's configured whitelist if not provided
      whitelist: whitelist ?? creatorNode?.passList,
      blacklist: blacklist ?? creatorNode?.blockList
    })

    this.creatorNode = creatorNode
    this.numberOfNodes = numberOfNodes
    this.ethContracts = ethContracts
    this.timeout = timeout
    this.equivalencyDelta = equivalencyDelta
    this.preferHigherPatchForPrimary = preferHigherPatchForPrimary
    this.preferHigherPatchForSecondaries = preferHigherPatchForSecondaries
    this.logger = logger

    this.healthCheckPath = 'health_check/verbose'
    // String array of healthy Content Node endpoints
    this.backupsList = []
    this.backupTimings = []
    // Max percentage (represented out of 100) allowed before determining CN is unsuitable for selection
    this.maxStorageUsedPercent = maxStorageUsedPercent
    // The decision tree path that was taken. Reset on each new selection.
    this.decisionTree = []
  }

  /**
   * Selects a primary and secondary Content Nodes. Order of preference is highest version, then response time.
   *
   * 1. Retrieve all the Content Node services
   * 2. Filter from/out Content Nodes based off of the whitelist and blacklist
   * 3. Filter out unhealthy, outdated, and still syncing nodes via health and sync check
   * 4. Sort by healthiest (highest version -> lowest version); secondary check if equal version based off of responseTime
   * 5. Select a primary and numberOfNodes-1 number of secondaries (most likely 2) from backups
   * @param performSyncCheck whether or not to check whether the nodes need syncs before selection
   */
  override async select(performSyncCheck = true, log = true) {
    // Reset decision tree and backups
    this.decisionTree = []
    this.clearBackups()
    this.clearUnhealthy()

    // Get all the Content Node endpoints on chain and filter
    let services = await this.getServices()
    this.decisionTree.push({
      stage: DECISION_TREE_STATE.GET_ALL_SERVICES,
      val: services
    })

    if (this.whitelist) {
      services = this.filterToWhitelist(services)
    }
    this.decisionTree.push({
      stage: DECISION_TREE_STATE.FILTER_TO_WHITELIST,
      val: services
    })

    if (this.blacklist) {
      services = this.filterFromBlacklist(services)
    }
    this.decisionTree.push({
      stage: DECISION_TREE_STATE.FILTER_FROM_BLACKLIST,
      val: services
    })

    // TODO: add a sample size selection round to not send requests to all available nodes

    if (performSyncCheck) {
      services = await this._performSyncChecks(services, this.timeout)
      this.decisionTree.push({
        stage: DECISION_TREE_STATE.FILTER_OUT_SYNC_IN_PROGRESS,
        val: services
      })
    }
    const {
      healthyServicesList,
      healthyServicesMap: servicesMap,
      healthyServiceTimings
    } = await this._performHealthChecks(services)
    services = healthyServicesList

    let primary: string
    if (this.preferHigherPatchForPrimary) {
      const serviceTimingsSortedByVersion = sortServiceTimings({
        serviceTimings: healthyServiceTimings,
        currentVersion: this.currentVersion,
        sortByVersion: true,
        equivalencyDelta: this.equivalencyDelta
      })
      const servicesSortedByVersion = serviceTimingsSortedByVersion.map(
        (service) => service.request.id as string
      )
      primary = this.getPrimary(servicesSortedByVersion)
    } else {
      primary = this.getPrimary(services)
    }

    // `this.backupsList` & this.backupTimings are used in selecting secondaries
    const backupsList = _.without(services, primary)
    const backupTimings = healthyServiceTimings.filter(
      (timing) => timing.request.id !== primary
    )
    this.setBackupsList(backupsList, backupTimings)

    const secondaries = this.getSecondaries()

    this.decisionTree.push({
      stage: DECISION_TREE_STATE.SELECT_PRIMARY_AND_SECONDARIES,
      val: {
        primary,
        secondaries: secondaries.toString(),
        services: Object.keys(servicesMap).toString()
      }
    })

    if (log) {
      this.logger.info(
        'CreatorNodeSelection - final decision tree state',
        this.decisionTree
      )
    }
    return { primary, secondaries, services: servicesMap }
  }

  /**
   * Checks the sync progress of a Content Node
   * @param service Content Node endopint
   * @param timeout ms
   */
  async getSyncStatus(service: ServiceName, timeout: Timeout = null) {
    try {
      const syncStatus = await this.creatorNode.getSyncStatus(service, timeout)
      return { service, syncStatus, error: null }
    } catch (e) {
      return { service, syncStatus: null, error: e }
    }
  }

  /**
   * Sets backupsList to input
   * @param backupsList string array of Content Node endpoints
   */
  setBackupsList(backupsList: ServiceName[], backupTimings: Timing[]) {
    // Rest of services that are not selected as the primary are valid backups. Add as backup
    // This backups list will also be in order of descending highest version/fastest
    this.backupsList = backupsList
    this.backupTimings = backupTimings
  }

  /**
   * Get backups in the form of an array
   */
  getBackupsList() {
    return this.backupsList
  }

  /**
   * Get backup timings in the form of an array
   */
  getBackupTimings() {
    return this.backupTimings
  }

  /**
   * Select a primary Content Node
   * @param {string[]} services all healthy Content Node endpoints
   */
  getPrimary(services: string[]) {
    // Index 0 of services will be the most optimal Content Node candidate
    // TODO: fix `as` cast
    return services[0] as string
  }

  /**
   * Selects secondary Content Nodes
   * Returns first nodes from `services`, optionally sorted by version
   */
  getSecondaries() {
    const numberOfSecondaries = this.numberOfNodes - 1
    const backupsList = this.getBackupsList()
    const backupTimings = this.getBackupTimings()

    let secondaries
    if (this.preferHigherPatchForSecondaries) {
      const backupTimingsSortedByVersion = sortServiceTimings({
        serviceTimings: backupTimings,
        currentVersion: this.currentVersion,
        sortByVersion: true,
        equivalencyDelta: this.equivalencyDelta
      })
      const secondaryTimings = backupTimingsSortedByVersion.slice(
        0,
        numberOfSecondaries
      )
      secondaries = secondaryTimings.map(
        (timing) => timing.request.id as string
      )
    } else {
      secondaries = backupsList.slice(0, numberOfSecondaries)
    }

    return secondaries
  }

  /**
   * Performs a sync check for every endpoint in services. Returns an array of successful sync checked endpoints and
   * adds the err'd sync checked endpoints to this.unhealthy
   * @param services content node endpoints
   * @param timeout ms applied to each request
   */
  async _performSyncChecks(services: ServiceName[], timeout: Timeout = null) {
    const successfulSyncCheckServices: ServiceName[] = []
    const syncResponses = await Promise.all(
      services.map(
        async (service) => await this.getSyncStatus(service, timeout)
      )
    )
    // Perform sync checks on all services
    for (const response of syncResponses) {
      // Could not perform a sync check. Add to unhealthy
      if (response.error) {
        this.logger.warn(
          `CreatorNodeSelection - Failed sync status check for ${response.service}: ${response.error}`
        )
        this.addUnhealthy(response.service)
        continue
      }

      const { syncStatus } = response
      if (!syncStatus) continue
      const { isBehind, isConfigured } = syncStatus
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

    return successfulSyncCheckServices
  }

  /**
   * Performs a health check for every endpoint in services. Returns an array of successful health checked endpoints and
   * adds the err'd health checked endpoints to this.unhealthy, and a mapping of successful endpoint to its health check response.
   * @param services content node endpoints
   */
  async _performHealthChecks(services: string[]) {
    // Perform a health check on services that passed the sync checks
    const healthCheckedServices = await timeRequests({
      requests: services.map((node) => ({
        id: node,
        url: `${node}/${this.healthCheckPath}`
      })),
      sortByVersion: false,
      currentVersion: this.currentVersion,
      timeout: this.timeout,
      equivalencyDelta: this.equivalencyDelta,
      headers: {
        'User-Agent':
          'Axios - @audius/sdk - CreatorNodeSelection.ts#_performHealthChecks'
      }
    })

    const healthyServices = healthCheckedServices.filter((resp) => {
      const endpoint = resp.request.id as string
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
          this.currentVersion as string,
          resp.response.data.data.version
        )

        const { healthy: isHealthyStatus } = resp.response.data.data

        const { storagePathSize, storagePathUsed, maxStorageUsedPercent } =
          resp.response.data.data
        if (maxStorageUsedPercent) {
          this.maxStorageUsedPercent = maxStorageUsedPercent
        } else {
          this.logger.warn(
            `maxStorageUsedPercent not found in health check response. Using constructor value of ${this.maxStorageUsedPercent}% as maxStorageUsedPercent.`
          )
        }
        const hasEnoughStorage = this._hasEnoughStorageSpace(
          storagePathSize,
          storagePathUsed
        )
        isHealthy = isUp && versionIsUpToDate && hasEnoughStorage && isHealthyStatus
      }

      if (!isHealthy) {
        this.addUnhealthy(endpoint)
      }

      return isHealthy
    })

    // Create a mapping of healthy services and their responses. Used on dapp to display the healthy services for selection
    // Also update services to be healthy services
    const servicesMap: Record<string, AxiosResponse['data']> = {}
    const healthyServicesList = healthyServices.map((service) => {
      const requestId = service.request.id as string
      servicesMap[requestId] = service.response?.data
      return service.request.id as string
    })

    this.decisionTree.push({
      stage:
        DECISION_TREE_STATE.FILTER_OUT_UNHEALTHY_OUTDATED_AND_NO_STORAGE_SPACE,
      val: healthyServicesList
    })

    // Record metrics
    if (this.creatorNode?.monitoringCallbacks.healthCheck) {
      healthCheckedServices.forEach((check) => {
        if (check.response?.data) {
          const url = new URL(check.request.url)
          const data = check.response.data.data
          try {
            this.creatorNode.monitoringCallbacks.healthCheck?.({
              endpoint: url.origin,
              pathname: url.pathname,
              searchParams: url.searchParams,
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
              transferredBytesPerSec: data.transferredBytesPerSec,
              transcodeWaiting: data.transcodeWaiting,
              transcodeActive: data.transcodeActive,
              fileProcessingWaiting: data.fileProcessingWaiting,
              fileProcessingActive: data.fileProcessingActive
            })
          } catch (e) {
            // Swallow errors -- this method should not throw generally
            this.logger.error(e)
          }
        }
      })
    }

    return {
      healthyServicesList,
      healthyServicesMap: servicesMap,
      healthyServiceTimings: healthyServices
    }
  }

  _hasEnoughStorageSpace(
    storagePathSize?: number | null,
    storagePathUsed?: number | null
  ) {
    // If for any reason these values off the response is falsy value, default to enough storage
    if (
      storagePathSize === null ||
      storagePathSize === undefined ||
      storagePathUsed === null ||
      storagePathUsed === undefined
    ) {
      return true
    }

    return (
      (100 * storagePathUsed) / storagePathSize < this.maxStorageUsedPercent
    )
  }
}

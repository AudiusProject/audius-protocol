import { sampleSize } from 'lodash'
import {
  raceRequests,
  allRequests,
  ServiceName,
  ServiceWithEndpoint,
  Service,
  Maybe
} from '../utils'
import { DECISION_TREE_STATE } from './constants'
import type { AxiosResponse } from 'axios'

function isVerbose(service: Service): service is ServiceWithEndpoint {
  return typeof service !== 'string'
}

export type GetServicesInput =
  | (() => Promise<ServiceName[]>)
  | ((config: { verbose: false }) => Promise<ServiceName[]>)
  | ((config: { verbose: true }) => Promise<ServiceWithEndpoint[]>)
  | ((config: {
      verbose: boolean
    }) => Promise<ServiceName[] | ServiceWithEndpoint[]>)

interface GetServices {
  (): Promise<ServiceName[]>
  (config: { verbose: false }): Promise<ServiceName[]>
  (config: { verbose: true }): Promise<ServiceWithEndpoint[]>
  (config: { verbose: boolean }): Promise<Service[]>
}

export interface Decision {
  stage: string
  val?: unknown
}

export type Backup = { block_difference: number; version: string }

export interface ServiceSelectionConfig {
  // services from this list should not be picked
  blacklist?: Set<string> | undefined | null
  // only services from this list are allowed to be picked
  whitelist?: Set<string> | undefined | null
  /*
   * an (async) method to get a
   * list of services to choose from. Optionally may return a verbose object with service metadata
   */
  getServices: GetServicesInput
  /*
   * the maximum number of requests allowed to fire at
   * once. Tweaking this value may impact browser performance
   */
  maxConcurrentRequests?: number
  // the timeout at which to give up on a service
  requestTimeout?: Maybe<number>
  /*
   *the point at which the unhealthy services are freed so they
   * may be tried again (re-requested)
   */
  unhealthyTTL?: number
  /*
   * the point at which backup services are freed so they may be
   * tried again (re-requested)
   */
  backupsTTL?: number
}

/**
 * A class that assists with autoselecting services.
 * `ServiceSelection` is intended to be overridden with further
 * business logic that a particular sevice might preference.
 *
 * The general use case is as follows:
 *
 * ```
 *
 * const selector = new ServiceSelection({
 *   getServices: ethContracts.getDiscoveryProviders()
 * })
 *
 * const service = await selector.select()
 *
 * ```
 *
 * This class operates by taking a list of services and
 * round-robin makes requests at them until a suitable one is found.
 *
 * Two types of "bad" services are defined below:
 *  - Unhealthy: this service is bad and should not be used
 *  - Backup: this service is bad, but if we can't find anything better, maybe use it
 *
 * Classes that extend `ServiceSelection` can choose to implement custom logic on top
 * of them and is generally how this class is intended to be used.
 */
export class ServiceSelection {
  blacklist: Set<string> | undefined | null
  whitelist: Set<string> | undefined | null
  getServices: GetServices
  maxConcurrentRequests: number
  requestTimeout: number
  unhealthyTTL: number
  backupsTTL: number
  unhealthy: Set<string>
  backups: Record<string, Backup>
  totalAttempts: number
  decisionTree: Decision[]
  unhealthyCleanupTimeout: number | null = null
  backupCleanupTimeout: number | null = null

  constructor({
    blacklist,
    whitelist,
    getServices,
    maxConcurrentRequests = 6,
    requestTimeout = 30 * 1000, // 30s
    unhealthyTTL = 60 * 60 * 1000, // 1 hour
    backupsTTL = 2 * 60 * 1000 // 2 min
  }: ServiceSelectionConfig) {
    // For Creator Node selection
    this.blacklist = blacklist
    this.whitelist = whitelist
    this.getServices = getServices as GetServices
    this.maxConcurrentRequests = maxConcurrentRequests
    this.requestTimeout = requestTimeout
    this.unhealthyTTL = unhealthyTTL
    this.backupsTTL = backupsTTL

    // Truly "unhealthy" services. Should not ever be picked.
    this.unhealthy = new Set([])

    // Selectable services but not optimal. Will be picked as a last resort.
    this.backups = {}

    // Total number of services attempted
    this.totalAttempts = 0

    // The decision tree path that was taken. Reset on each new selection.
    this.decisionTree = []
  }

  /**
   * Selects a service
   * @param reset if reset is true, clear the decision tree
   */
  // we need any type here to allow sub-classes to more strictly type return type
  async select(reset: any = true): Promise<any> {
    if (reset) {
      this.decisionTree = []
    }

    // If a short circuit is provided, take it. Don't check it, just use it.
    const shortcircuit = await this.shortcircuit()
    this.decisionTree.push({
      stage: DECISION_TREE_STATE.CHECK_SHORT_CIRCUIT,
      val: shortcircuit
    })
    // If there is a shortcircuit defined and we have not blacklisted it, pick it
    if (shortcircuit && (!this.blacklist || !this.blacklist.has(shortcircuit)))
      return shortcircuit

    // Get all the services
    let services = await this.getServices()
    this.decisionTree.push({
      stage: DECISION_TREE_STATE.GET_ALL_SERVICES,
      val: services
    })

    // If a whitelist is provided, filter down to it
    if (this.whitelist) {
      services = this.filterToWhitelist(services)
      this.decisionTree.push({
        stage: DECISION_TREE_STATE.FILTER_TO_WHITELIST,
        val: services
      })
    }

    // if a blacklist is provided, filter out services in the list
    if (this.blacklist) {
      services = this.filterFromBlacklist(services)
      this.decisionTree.push({
        stage: DECISION_TREE_STATE.FILTER_FROM_BLACKLIST,
        val: services
      })
    }

    // Filter out anything we know is already unhealthy
    const filteredServices = this.filterOutKnownUnhealthy(services)
    this.decisionTree.push({
      stage: DECISION_TREE_STATE.FILTER_OUT_KNOWN_UNHEALTHY,
      val: filteredServices
    })

    // Randomly sample a "round" to test
    const round = this.getSelectionRound(filteredServices)
    this.decisionTree.push({
      stage: DECISION_TREE_STATE.GET_SELECTION_ROUND,
      val: round
    })

    this.totalAttempts += round.length

    // If there are no services left to try, either pick a backup or return null
    if (filteredServices.length === 0) {
      this.decisionTree.push({
        stage: DECISION_TREE_STATE.NO_SERVICES_LEFT_TO_TRY
      })
      if (this.getBackupsSize() > 0) {
        // Some backup exists
        const backup = await this.selectFromBackups()
        this.decisionTree.push({
          stage: DECISION_TREE_STATE.SELECTED_FROM_BACKUP,
          val: backup
        })
        return backup
      } else {
        // Nothing could be found that was healthy.
        // Reset everything we know so that we might try again.
        this.unhealthy = new Set([])
        this.backups = {}
        this.decisionTree.push({
          stage: DECISION_TREE_STATE.FAILED_AND_RESETTING
        })
        return null
      }
    }

    // Race this "round" of services, getting the best and ones that errored
    // Note: ones that did not error or were not the best just get canceled so
    // we don't really know anything about them at this point.
    const { best, errored } = await this.race(round)

    // Mark all the errored ones as unhealthy
    errored.forEach((e) => {
      if (e) {
        this.addUnhealthy(e)
      }
    })

    // Trigger a cleanup event for all of the unhealthy and backup services,
    // so they can get retried in the future
    this.triggerCleanup()

    // Recursively try this selection function if we didn't find something
    if (!best) {
      this.decisionTree.push({ stage: DECISION_TREE_STATE.ROUND_FAILED_RETRY })
      return await this.select(/* reset */ false)
    }

    this.decisionTree.push({
      stage: DECISION_TREE_STATE.MADE_A_SELECTION,
      val: best
    })
    // If we made it this far, we found the best service! (of the rounds we tried)
    return best
  }

  /**
   * Finds all selectable services (respecting whitelist, health checks & timeouts).
   * Note: this method is potentially slow.
   * If you need just a single service, prefer calling `.select()`
   * @param {boolean} verbose whether or not to return full services metadata
   * @param {Set} whitelist a whitelist to override the set of endpoints
   */
  async findAll({ verbose = false, whitelist = this.whitelist } = {}) {
    // Get all the services
    let services = await this.getServices({ verbose })

    // If a whitelist is provided, filter down to it
    if (whitelist) {
      services = services.filter((service) =>
        whitelist.has(isVerbose(service) ? service.endpoint : service)
      )
    }

    // Key the services by their health check endpoint
    const urlMap = services.reduce<Record<string, Service>>(
      (urlMap, service) => {
        urlMap[
          ServiceSelection.getHealthCheckEndpoint(
            isVerbose(service) ? service.endpoint : service
          )
        ] = service
        return urlMap
      },
      {}
    )

    try {
      const results = await allRequests({
        urlMap,
        timeout: this.requestTimeout,
        validationCheck: (resp) => this.isHealthy(resp, urlMap)
      })
      return results
    } catch (e) {
      console.error(e)
      return []
    }
  }

  /** Triggers a clean up of unhealthy and backup services so they can be retried later */
  triggerCleanup() {
    if (this.unhealthyCleanupTimeout) {
      clearTimeout(this.unhealthyCleanupTimeout)
    }

    if (this.backupCleanupTimeout) {
      clearTimeout(this.backupCleanupTimeout)
    }

    this.unhealthyCleanupTimeout = setTimeout(() => {
      this.clearUnhealthy()
    }, this.unhealthyTTL)
    this.backupCleanupTimeout = setTimeout(() => {
      this.clearBackups()
    }, this.backupsTTL)
  }

  clearUnhealthy() {
    this.unhealthy = new Set([])
  }

  clearBackups() {
    this.backups = {}
  }

  /** A short-circuit. If overriden, can be used to skip selection (which could be slow) */
  async shortcircuit(): Promise<null | string> {
    return null
  }

  /**
   * Filter out services that are in the blacklist
   * @param services endpoints
   */
  filterFromBlacklist(services: string[]) {
    return services.filter((s) => !this.blacklist?.has(s))
  }

  /** Filter down services to those in the whitelist */
  filterToWhitelist(services: string[]) {
    return services.filter((s) => this.whitelist?.has(s))
  }

  /** Filter out known unhealthy services from the provided */
  filterOutKnownUnhealthy(services: string[]) {
    return services.filter((s) => !this.unhealthy.has(s))
  }

  /** Given a list of services, samples maxConcurrentRequests from them */
  getSelectionRound(services: string[]) {
    return sampleSize(services, this.maxConcurrentRequests)
  }

  /** Gets the total number of attempts we've made this instantiation */
  getTotalAttempts() {
    return this.totalAttempts
  }

  /** Where does the health check for this type of service live */
  static getHealthCheckEndpoint(service: string) {
    return `${service}/health_check`
  }

  /**
   * What the criteria is for a healthy service
   * @param response axios response
   * @param {{ [key: string]: string}} urlMap health check urls mapped to their cannonical url
   * e.g. https://discoveryprovider.audius.co/health_check => https://discoveryprovider.audius.co
   */
  isHealthy(response: AxiosResponse, _urlMap: Record<string, Service>) {
    return response.status === 200
  }

  /** Races requests against each other with provided timeouts and health checks */
  async race(services: string[]) {
    // Key the services by their health check endpoint
    const serviceMap = services.reduce<Record<string, string>>((acc, s) => {
      acc[ServiceSelection.getHealthCheckEndpoint(s)] = s
      return acc
    }, {})

    let best: string | null = null
    try {
      const { errored } = await raceRequests(
        Object.keys(serviceMap),
        (url) => {
          best = serviceMap[url] as string
        },
        {},
        /* timeout */ this.requestTimeout,
        /* timeBetweenRequests */ 0,
        /* validationCheck */ (resp) => this.isHealthy(resp, serviceMap)
      )
      this.decisionTree.push({
        stage: DECISION_TREE_STATE.RACED_AND_FOUND_BEST,
        val: best
      })
      return {
        best,
        errored: errored.map((e) => serviceMap[e.config.url ?? ''])
      }
    } catch (e) {
      return { best: null, errored: [] }
    }
  }

  /** Adds a service to the unhealthy set */
  addUnhealthy(service: ServiceName) {
    this.unhealthy.add(service)
  }

  /** Gets unhealthy set size */
  getUnhealthySize() {
    return this.unhealthy.size
  }

  /**
   * Removes from unhealthy set
   * @param key service endpoint
   */
  removeFromUnhealthy(key: string) {
    if (this.unhealthy.has(key)) this.unhealthy.delete(key)
  }

  /**
   * Adds a service to the list of backups
   * @param service the service to add
   * @param response the services response. This can be used to weigh various
   * backups against eachother
   */
  addBackup(service: string, response: Backup) {
    this.backups[service] = response
  }

  /**
   * Controls how a backup is picked. Overriding methods may choose to use the backup's response.
   * e.g. pick a backup that's the fewest versions behind
   */
  async selectFromBackups() {
    return Object.keys(this.backups)[0]
  }

  /**
   * Removes from backups
   * @param key service endpoint
   */
  removeFromBackups(key: string) {
    if (Object.prototype.hasOwnProperty.call(this.backups, key))
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete this.backups[key]
  }

  /**
   * Returns the size of backups
   */
  getBackupsSize() {
    return Object.keys(this.backups).length
  }
}

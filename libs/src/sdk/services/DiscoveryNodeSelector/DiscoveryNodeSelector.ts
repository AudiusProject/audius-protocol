import semver from 'semver'
import sampleSize from 'lodash/sampleSize'
import { ApiHealthResponseData, HealthCheckStatus } from './healthCheckTypes'
import {
  getDiscoveryNodeApiHealth,
  getDiscoveryNodeHealthCheck
} from './healthChecks'
import { promiseAny } from '../../utils/promiseAny'
import {
  defaultDiscoveryNodeSelectorConfig,
  DISCOVERY_SELECTOR_LOCAL_STORAGE_KEY
} from './constants'
import type {
  Middleware,
  RequestContext,
  ResponseContext
} from '../../api/generated/default'
import {
  BackupHealthData,
  Backup,
  Decision,
  DECISION_TREE_STATE,
  DiscoveryNodeSelectorService,
  DiscoveryNodeSelectorServiceConfig,
  DiscoveryNodeSelectorServiceConfigInternal,
  ServiceSelectionEvents
} from './types'
import type TypedEventEmitter from 'typed-emitter'
import EventEmitter from 'events'
import { AbortController as AbortControllerPolyfill } from 'node-abort-controller'

export class DiscoveryNodeSelector implements DiscoveryNodeSelectorService {
  /**
   * List of services to select from
   */
  private services: string[]

  /**
   * Currently selected discovery node
   */
  private selectedNode: string | null

  /**
   * Configuration passed in by consumer (with defaults)
   */
  private readonly config: DiscoveryNodeSelectorServiceConfigInternal

  /**
   * Whether or not we are using a backup, meaning we were
   * unable to select a discovery node that was up-to-date and healthy.
   * Clients may want to consider blocking writes as service may be degraded
   */
  private _isBehind: boolean

  get isBehind() {
    return this._isBehind
  }

  private set isBehind(isBehind: boolean) {
    if (isBehind && !this._isBehind) {
      this.warn('using behind discovery node', this.selectedNode)
    } else if (!isBehind && this._isBehind) {
      this.info('discovery node no longer behind', this.selectedNode)
    }
    this._isBehind = isBehind
  }

  /**
   * During selection, services that fail health check will be put in this list
   * so that we try different nodes on new rounds of selection
   */
  private unhealthyServices: Set<string>

  /**
   * List of services that were found to be unhealthy but still usable in a pinch
   */
  private backupServices: Record<string, Backup>

  /**
   * Reference to a setTimeout for removing services from the unhealthy list so they can be retried
   */
  private unhealthyCleanupTimeout: NodeJS.Timeout | null = null

  /**
   * Reference to a setTimeout for removing services from the backup list so they can be retried
   */
  private backupCleanupTimeout: NodeJS.Timeout | null = null

  /**
   * Composed EventEmitter for alerting listeners of reselections
   */
  private readonly eventEmitter: TypedEventEmitter<ServiceSelectionEvents>

  /**
   * Proxy to the event emitter addListener
   */
  public addEventListener
  /**
   * Proxy to the event emitter removeListener
   */
  public removeEventListener
  /**
   * Proxy to the event emitter removeAllEventListeners
   */
  public removeAllEventListeners

  constructor(config: DiscoveryNodeSelectorServiceConfig) {
    this.config = {
      ...defaultDiscoveryNodeSelectorConfig,
      ...config,
      healthCheckThresholds: {
        ...defaultDiscoveryNodeSelectorConfig.healthCheckThresholds,
        ...config.healthCheckThresholds
      }
    }
    this.services = config.bootstrapServices
    this._isBehind = false
    this.unhealthyServices = new Set([])
    this.backupServices = {}
    this.selectedNode = this.config.initialSelectedNode
    this.eventEmitter =
      new EventEmitter() as TypedEventEmitter<ServiceSelectionEvents>
    this.addEventListener = this.eventEmitter.addListener.bind(
      this.eventEmitter
    )
    this.removeEventListener = this.eventEmitter.removeListener.bind(
      this.eventEmitter
    )
    this.removeAllEventListeners = this.eventEmitter.removeAllListeners.bind(
      this.eventEmitter
    )
  }

  /**
   * Returns a middleware that reselects if the current discovery node is behind
   * @returns the middleware
   */
  public createMiddleware(): Middleware {
    const selectionPromise = this.select()
    return {
      pre: async (context: RequestContext) => {
        let url = context.url
        if (!url.startsWith('http')) {
          const endpoint = await selectionPromise
          url = `${endpoint}${context.url}`
        } else if (this.selectedNode && !url.startsWith(this.selectedNode)) {
          // Wrong endpoint! We have a new discovery node!
          const oldUrl = new URL(context.url)
          url = `${this.selectedNode}${oldUrl.pathname}${oldUrl.search}`
        }
        return { url, init: context.init }
      },
      post: async (context: ResponseContext) => {
        const response = context.response
        const endpoint = context.response.url.substring(
          context.url.length - context.response.url.length
        )
        if (response.ok) {
          // Even when successful, copy response to read JSON body to
          // check for signs the DN is unhealthy and reselect if necessary.
          // This will get the client to pick new discovery providers
          // if the selected one falls behind, even if requests are succeeding
          const responseClone = response.clone()
          const data = (await responseClone.json()) as ApiHealthResponseData
          const { health, reason } = getDiscoveryNodeApiHealth({
            data,
            healthCheckThresholds: this.config.healthCheckThresholds
          })
          await this.reselectIfNecessary({
            endpoint,
            health,
            reason,
            data: {
              block_difference:
                (data.latest_chain_block ?? 0) -
                (data.latest_indexed_block ?? 0),
              version: data.version?.version ?? ''
            }
          })
        } else {
          // On request failure, check health_check and reselect if unhealthy
          this.warn('request failed', context)
          const { health, data, reason } = await getDiscoveryNodeHealthCheck({
            endpoint,
            healthCheckThresholds: this.config.healthCheckThresholds
          })
          await this.reselectIfNecessary({
            endpoint,
            health,
            reason,
            data: {
              block_difference: data?.block_difference ?? 0,
              version: data?.version ?? ''
            }
          })
        }
        return response
      }
    }
  }

  public async getSelectedEndpoint() {
    if (this.selectedNode !== null) {
      return this.selectedNode
    }
    return await this.select()
  }

  /**
   * Finds a healthy discovery node
   * @returns a healthy discovery node endpoint
   */
  private async select() {
    this.debug('Selecting new discovery node...')
    // If a short circuit is provided, take it. Don't check it, just use it.
    const shortcircuit = await this.getCached()
    const decisionTree: Decision[] = []
    decisionTree.push({
      stage: DECISION_TREE_STATE.CHECK_SHORT_CIRCUIT,
      val: shortcircuit
    })
    // If there is a shortcircuit defined and we have not blacklisted it, pick it
    if (
      shortcircuit &&
      (!this.config.blocklist || !this.config.blocklist.has(shortcircuit))
    ) {
      this.selectedNode = shortcircuit
      this.info(`Selected discprov ${this.selectedNode}`, decisionTree)
      return shortcircuit
    }

    // Get all the services we have
    let services = [...this.services]
    decisionTree.push({
      stage: DECISION_TREE_STATE.GET_ALL_SERVICES,
      val: services
    })

    // If a whitelist is provided, filter down to it
    if (this.config.allowlist) {
      services = services.filter((s) => this.config.allowlist?.has(s))
      decisionTree.push({
        stage: DECISION_TREE_STATE.FILTER_TO_WHITELIST,
        val: services
      })
    }

    // if a blacklist is provided, filter out services in the list
    if (this.config.blocklist) {
      services = services.filter((s) => !this.config.blocklist?.has(s))
      decisionTree.push({
        stage: DECISION_TREE_STATE.FILTER_FROM_BLACKLIST,
        val: services
      })
    }

    let selectedService: string | null = null
    let attemptedServicesCount: number = 0

    // Loop until a healthy node is found, batching health_check requests by maxConcurrentRequests
    while (selectedService === null) {
      // Filter out anything we know is already unhealthy
      const filteredServices = services.filter(
        (s) => !this.unhealthyServices.has(s)
      )
      decisionTree.push({
        stage: DECISION_TREE_STATE.FILTER_OUT_KNOWN_UNHEALTHY,
        val: filteredServices
      })

      // If there are no services left to try, either pick a backup or return null
      if (filteredServices.length === 0) {
        decisionTree.push({
          stage: DECISION_TREE_STATE.NO_SERVICES_LEFT_TO_TRY
        })
        if (Object.keys(this.backupServices).length > 0) {
          // Some backup exists
          const backup = await this.selectFromBackups()
          decisionTree.push({
            stage: DECISION_TREE_STATE.SELECTED_FROM_BACKUP,
            val: backup
          })
          this.selectedNode = backup
          this.isBehind = true
          return backup
        } else {
          // Nothing could be found that was healthy.
          // Reset everything we know so that we might try again.
          this.unhealthyServices = new Set([])
          this.backupServices = {}
          decisionTree.push({
            stage: DECISION_TREE_STATE.FAILED_AND_RESETTING
          })
          this.error('Failed to select discovery node', decisionTree)
          return null
        }
      }

      // Randomly sample a "round" to test
      const round = sampleSize(
        filteredServices,
        this.config.maxConcurrentRequests
      )
      decisionTree.push({
        stage: DECISION_TREE_STATE.GET_SELECTION_ROUND,
        val: round
      })

      // Race this "round" of services to find the quickest healthy node
      selectedService = await this.anyHealthyEndpoint(round)
      attemptedServicesCount += round.length

      // Retry if none were found
      if (!selectedService) {
        decisionTree.push({
          stage: DECISION_TREE_STATE.ROUND_FAILED_RETRY
        })
        this.debug('No healthy services found. Attempting another round...', {
          attemptedServicesCount
        })
      }
    }

    // Trigger a cleanup event for all of the unhealthy and backup services,
    // so they can get retried in the future
    this.triggerCleanup()

    decisionTree.push({
      stage: DECISION_TREE_STATE.MADE_A_SELECTION,
      val: selectedService
    })
    // If we made it this far, we found the best service! (of the rounds we tried)
    if (selectedService) {
      this.setCached(selectedService)
      this.selectedNode = selectedService
      this.eventEmitter.emit('change', selectedService)
    }
    this.info(`Selected discprov ${selectedService}`, decisionTree, {
      attemptedServicesCount
    })
    return selectedService
  }

  /** Retrieves a cached discovery node from localstorage */
  private async getCached() {
    if (this.config.localStorage) {
      try {
        const discProvTimestamp = await this.config.localStorage.getItem(
          DISCOVERY_SELECTOR_LOCAL_STORAGE_KEY
        )
        if (discProvTimestamp) {
          const { endpoint: latestEndpoint, timestamp } =
            JSON.parse(discProvTimestamp)

          const allowed =
            !this.config.allowlist || this.config.allowlist.has(latestEndpoint)

          const isExpired =
            this.config.cacheTTL !== null &&
            Date.now() - timestamp > this.config.cacheTTL

          if (!allowed || isExpired) {
            this.clearCached()
          } else {
            return latestEndpoint as string
          }
        }
      } catch (e) {
        this.error(
          'Could not retrieve cached discovery endpoint from localStorage',
          e
        )
      }
    }
    return null
  }

  /** Clears any cached discovery node from localstorage */
  private async clearCached() {
    if (this.config.localStorage) {
      await this.config.localStorage.removeItem(
        DISCOVERY_SELECTOR_LOCAL_STORAGE_KEY
      )
    }
  }

  /** Sets a cached discovery node in localstorage */
  private async setCached(endpoint: string) {
    if (this.config.localStorage) {
      await this.config.localStorage.setItem(
        DISCOVERY_SELECTOR_LOCAL_STORAGE_KEY,
        JSON.stringify({ endpoint, timestamp: Date.now() })
      )
    }
  }

  /**
   * Checks to see if any of the endpoints are healthy, returning the first one that is.
   * Cancels the remaining promises.
   * Uses the configured timeout.
   * Any unhealthy or behind services found are placed into the unhealthy and backup lists respectively
   *
   * @param endpoints the endpoints to race
   * @returns the fastest healthy endpoint or null if none are healthy
   */
  private async anyHealthyEndpoint(endpoints: string[]) {
    const abortController = new AbortControllerPolyfill() as AbortController
    const requestPromises = endpoints.map(async (endpoint) => {
      const { health, data, reason } = await getDiscoveryNodeHealthCheck({
        endpoint,
        fetchOptions: { signal: abortController.signal },
        timeoutMs: this.config.requestTimeout,
        healthCheckThresholds: this.config.healthCheckThresholds
      })
      if (health !== HealthCheckStatus.HEALTHY) {
        if (health === HealthCheckStatus.UNHEALTHY) {
          this.unhealthyServices.add(endpoint)
        } else if (health === HealthCheckStatus.BEHIND) {
          this.unhealthyServices.add(endpoint)
          if (data) {
            this.backupServices[endpoint] = {
              endpoint,
              block_difference: data.block_difference!,
              version: data.version!
            }
          }
        }
        this.warn('health_check', endpoint, health, reason)
        throw new Error(`${endpoint} ${health}: ${reason}`)
      } else {
        // We're healthy!
        this.info('health_check', endpoint, health)
        // Cancel any existing requests from other promises
        abortController.abort()
        // Refresh service list with the healthy list from DN
        if (
          data?.network?.discoveryNodes &&
          data.network.discoveryNodes.length > 0
        ) {
          this.services = data.network.discoveryNodes
        } else {
          this.warn("Couldn't load new service list from healthy service")
        }
        return endpoint
      }
    })

    try {
      return await promiseAny(requestPromises)
    } catch (e) {
      this.error('No healthy nodes', e)
      return null
    }
  }

  /**
   * Checks the given endpoint's health check and reselects if necessary.
   * @param endpoint the endpoint to health_check
   * @returns a new discovery node if reselect was necessary, or the existing endpoint if reselect unnecessary
   */
  private async reselectIfNecessary({
    endpoint,
    health,
    reason,
    data
  }: {
    endpoint: string
    health: HealthCheckStatus
    reason?: string
    data: BackupHealthData
  }) {
    if (health === HealthCheckStatus.HEALTHY) {
      this.isBehind = false
      return endpoint
    } else if (this.isBehind && HealthCheckStatus.BEHIND) {
      return endpoint
    } else {
      if (health === HealthCheckStatus.UNHEALTHY || !data) {
        this.unhealthyServices.add(endpoint)
      } else if (health === HealthCheckStatus.BEHIND) {
        this.backupServices[endpoint] = {
          endpoint,
          block_difference: data.block_difference,
          version: data.version
        }
      }
      this.warn('health_check', endpoint, health, reason)
      this.clearCached()
      return await this.select()
    }
  }

  /**
   * Sets (or resets) a setTimeout to reset the backup and unhealthy service lists
   */
  private triggerCleanup() {
    if (this.unhealthyCleanupTimeout) {
      clearTimeout(this.unhealthyCleanupTimeout)
    }

    if (this.backupCleanupTimeout) {
      clearTimeout(this.backupCleanupTimeout)
    }

    this.unhealthyCleanupTimeout = setTimeout(() => {
      this.unhealthyServices = new Set([])
    }, this.config.unhealthyTTL)
    this.backupCleanupTimeout = setTimeout(() => {
      this.backupServices = {}
    }, this.config.backupsTTL)
  }

  /**
   * First try to get a node that's got a healthy blockdiff, but a behind version.
   * If that fails, get the node with the lowest blockdiff on the most up to date version
   */
  private async selectFromBackups() {
    const sortedBackups = Object.values(this.backupServices).sort((a, b) => {
      const versionSort = semver.rcompare(a.version, b.version)
      if (versionSort === 0) {
        return a.block_difference - b.block_difference
      }
      return versionSort
    })
    const goodBlockdiffBadVersion = sortedBackups.find(
      (s) =>
        s.block_difference <= this.config.healthCheckThresholds.maxBlockDiff
    )
    const nextBest = sortedBackups[0]
    if (!goodBlockdiffBadVersion && nextBest) {
      return nextBest.endpoint
    }
    return goodBlockdiffBadVersion?.endpoint ?? null
  }

  private debug(...args: any[]) {
    console.debug('[audius-sdk][discovery-node-selector]', ...args)
  }

  /** console.info proxy utility to add a prefix */
  private info(...args: any[]) {
    console.info('[audius-sdk][discovery-node-selector]', ...args)
  }

  /** console.warn proxy utility to add a prefix */
  private warn(...args: any[]) {
    console.warn('[audius-sdk][discovery-node-selector]', ...args)
  }

  /** console.error proxy utility to add a prefix */
  private error(...args: any[]) {
    console.warn('[audius-sdk][discovery-node-selector]', ...args)
  }
}

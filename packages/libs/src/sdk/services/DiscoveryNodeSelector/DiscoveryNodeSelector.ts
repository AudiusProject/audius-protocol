import EventEmitter from 'events'

import sampleSize from 'lodash/sampleSize'
import { AbortController as AbortControllerPolyfill } from 'node-abort-controller'
import semver from 'semver'
import type TypedEventEmitter from 'typed-emitter'

import type {
  ErrorContext,
  Middleware,
  RequestContext,
  ResponseContext
} from '../../api/generated/default'
import { mergeConfigWithDefaults } from '../../utils/mergeConfigs'
import { promiseAny } from '../../utils/promiseAny'
import type { LoggerService } from '../Logger'

import { defaultDiscoveryNodeSelectorConfig } from './constants'
import { ApiHealthResponseData, HealthCheckStatus } from './healthCheckTypes'
import {
  parseApiHealthStatusReason,
  getDiscoveryNodeHealthCheck,
  isFullFlaskResponse
} from './healthChecks'
import {
  BackupHealthData,
  Backup,
  Decision,
  DECISION_TREE_STATE,
  DiscoveryNodeSelectorService,
  DiscoveryNodeSelectorServiceConfig,
  DiscoveryNodeSelectorServiceConfigInternal,
  ServiceSelectionEvents,
  DiscoveryNode
} from './types'

const getPathFromUrl = (url: string) => {
  const pathRegex = /^([a-z]+:\/\/)?(?:www\.)?([^/]+)?(.*)$/

  const match = url.match(pathRegex)

  if (match?.[3]) {
    const path = match[3]
    return path
  } else {
    throw new Error(`Invalid URL, couldn't get path.`)
  }
}

export class DiscoveryNodeSelector implements DiscoveryNodeSelectorService {
  /**
   * List of services to select from
   */
  private services: DiscoveryNode[]

  /**
   * Currently selected discovery node
   */
  private selectedNode: string | null

  /**
   * Configuration passed in by consumer (with defaults)
   */
  private config: DiscoveryNodeSelectorServiceConfigInternal

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
      this.logger.warn('using behind discovery node', this.selectedNode)
    } else if (!isBehind && this._isBehind) {
      this.logger.info('discovery node no longer behind', this.selectedNode)
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

  private reselectLock: boolean = false

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

  private readonly logger: LoggerService

  constructor(config?: DiscoveryNodeSelectorServiceConfig) {
    this.config = mergeConfigWithDefaults(
      config,
      defaultDiscoveryNodeSelectorConfig
    )
    this.services = this.config.bootstrapServices
    this._isBehind = false
    this.unhealthyServices = new Set([])
    this.backupServices = {}
    this.selectedNode =
      this.config.initialSelectedNode &&
      (!this.config.allowlist ||
        this.config.allowlist?.has(this.config.initialSelectedNode)) &&
      !this.config.blocklist?.has(this.config.initialSelectedNode)
        ? this.config.initialSelectedNode
        : null
    this.eventEmitter =
      new EventEmitter() as TypedEventEmitter<ServiceSelectionEvents>
    // Potentially need many event listeners for discovery reselection (to prevent race condition)
    this.eventEmitter.setMaxListeners(1000)

    this.addEventListener = this.eventEmitter.addListener.bind(
      this.eventEmitter
    )
    this.removeEventListener = this.eventEmitter.removeListener.bind(
      this.eventEmitter
    )

    this.logger = this.config.logger.createPrefixedLogger(
      '[discovery-node-selector]'
    )
  }

  /**
   * Updates the config.
   * Note that setting the initial node or bootstrap nodes here does nothing as the service is already initialized.
   * Will force reselections if health check thresholds change (as that might cause the current node to be considered unhealthy)
   * or if the selected node is excluded per allow/blocklists
   */
  public updateConfig(
    config: Exclude<
      DiscoveryNodeSelectorServiceConfig,
      'initialSelectedNode' | 'bootstrapServices'
    >
  ) {
    this.config = mergeConfigWithDefaults(config, this.config)
    if (this.selectedNode) {
      if (config.healthCheckThresholds) {
        this.selectedNode = null
      } else if (config.allowlist && !config.allowlist.has(this.selectedNode)) {
        this.selectedNode = null
      } else if (config.blocklist?.has(this.selectedNode)) {
        this.selectedNode = null
      }
    }
  }

  /**
   * Returns a middleware that reselects if the current discovery node is behind
   * @returns the middleware
   */
  public createMiddleware(): Middleware {
    return {
      pre: async (context: RequestContext) => {
        let url = context.url
        if (!url.startsWith('http')) {
          const endpoint = await this.getSelectedEndpoint()
          url = `${endpoint}${context.url}`
        }
        return { url, init: context.init }
      },
      post: async (context: ResponseContext) => {
        const response = context.response
        const endpoint = await this.getSelectedEndpoint()
        if (!endpoint) {
          await this.select(endpoint)
        } else if (response.ok) {
          // Even when successful, copy response to read JSON body to
          // check for signs the DN is unhealthy and reselect if necessary.
          // This will get the client to pick new discovery providers
          // if the selected one falls behind, even if requests are succeeding
          const responseClone = response.clone()
          const data = (await responseClone.json()) as ApiHealthResponseData
          const { health, reason } = parseApiHealthStatusReason({
            data,
            healthCheckThresholds: this.config.healthCheckThresholds
          })
          const blockDiff = isFullFlaskResponse(data)
            ? (data.latest_chain_block ?? 0) - (data.latest_indexed_block ?? 0)
            : 0
          const version = isFullFlaskResponse(data)
            ? data.version?.version ?? ''
            : ''
          await this.reselectIfNecessary({
            endpoint,
            health,
            reason,
            data: {
              block_difference: blockDiff,
              version
            }
          })
        } else {
          const userError = response !== undefined && response.status < 500

          if (userError) {
            this.logger.warn(
              `status code ${response.status} below 500, not reselecting`,
              endpoint,
              context
            )
            return response
          }
          return await this.reselectAndRetry({ context, endpoint })
        }
        return response
      },
      onError: async (context: ErrorContext) => {
        const endpoint = await this.getSelectedEndpoint()
        const response = context.response

        if (!endpoint) {
          await this.select(endpoint)
        } else {
          return await this.reselectAndRetry({ context, endpoint })
        }
        return response
      }
    }
  }

  /**
   * Selects a discovery node or returns the existing selection
   * @returns a discovery node endpoint
   */
  public async getSelectedEndpoint() {
    if (this.selectedNode !== null) {
      return this.selectedNode
    }
    return await this.select(null)
  }

  /**
   * Gets the list of services
   */
  public async getServices() {
    const selected = await this.getSelectedEndpoint()
    if (selected) {
      // refresh the list
      await this.refreshServiceList(selected)
    }
    return this.services
  }

  /**
   * Finds a healthy discovery node
   * @returns a healthy discovery node endpoint
   */
  private async select(prevSelectedNode: string | null) {
    if (this.reselectLock) {
      await new Promise<void>((resolve) => {
        this.eventEmitter.once('reselectAttemptComplete', () => {
          resolve()
        })
      })
    }
    if (prevSelectedNode !== this.selectedNode && this.selectedNode != null) {
      return this.selectedNode
    }
    this.reselectLock = true

    try {
      this.logger.debug('Selecting new discovery node...')
      const decisionTree: Decision[] = []

      // Get all the services we have
      let services = [...this.services]
      decisionTree.push({
        stage: DECISION_TREE_STATE.GET_ALL_SERVICES,
        val: services
      })

      // If a whitelist is provided, filter down to it
      if (this.config.allowlist) {
        services = services.filter((s) =>
          this.config.allowlist?.has(s.endpoint)
        )
        decisionTree.push({
          stage: DECISION_TREE_STATE.FILTER_TO_WHITELIST,
          val: services
        })
      }

      // if a blacklist is provided, filter out services in the list
      if (this.config.blocklist) {
        services = services.filter(
          (s) => !this.config.blocklist?.has(s.endpoint)
        )
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
          (s) => !this.unhealthyServices.has(s.endpoint)
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
            this.logger.error('Failed to select discovery node', decisionTree)
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
        selectedService = await this.anyHealthyEndpoint(
          round.map((s) => s.endpoint)
        )
        attemptedServicesCount += round.length

        // Retry if none were found
        if (!selectedService) {
          decisionTree.push({
            stage: DECISION_TREE_STATE.ROUND_FAILED_RETRY
          })
          this.logger.debug(
            'No healthy services found. Attempting another round...',
            {
              attemptedServicesCount
            }
          )
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
        this.selectedNode = selectedService
        this.eventEmitter.emit('change', selectedService)
      }
      this.logger.info(`Selected discprov ${selectedService}`, decisionTree, {
        attemptedServicesCount
      })
      this.isBehind = false
      return this.selectedNode
    } finally {
      this.reselectLock = false
      this.eventEmitter.emit('reselectAttemptComplete')
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
        if (reason?.toLowerCase().includes('aborted')) {
          // Ignore aborted requests
          this.logger.debug('health_check', endpoint, health, reason)
        } else if (health === HealthCheckStatus.UNHEALTHY) {
          this.unhealthyServices.add(endpoint)
          this.logger.debug('health_check', endpoint, health, reason)
        } else if (health === HealthCheckStatus.BEHIND) {
          this.unhealthyServices.add(endpoint)
          if (data) {
            this.backupServices[endpoint] = {
              endpoint,
              block_difference: data.block_difference!,
              version: data.version!
            }
          }
          this.logger.debug('health_check', endpoint, health, reason)
        }
        throw new Error(`${endpoint} ${health}: ${reason}`)
      } else {
        // We're healthy!
        this.logger.debug('health_check', endpoint, health)
        // Cancel any existing requests from other promises
        abortController.abort()
        // Refresh service list with the healthy list from DN
        await this.refreshServiceList(endpoint, data?.network?.discovery_nodes)
        return endpoint
      }
    })

    try {
      return await promiseAny(requestPromises)
    } catch (e) {
      this.logger.error('No healthy nodes', e)
      return null
    }
  }

  private async refreshServiceList(endpoint: string, nodes?: DiscoveryNode[]) {
    if (!nodes) {
      const { data } = await getDiscoveryNodeHealthCheck({
        endpoint,
        healthCheckThresholds: this.config.healthCheckThresholds
      })
      nodes = data?.network?.discovery_nodes
    }
    if (nodes && nodes.length > 0) {
      this.logger.debug(`Refreshed service list with ${nodes.length} nodes.`)
      this.services = nodes
    } else {
      this.logger.warn(
        "Couldn't load new service list from healthy service",
        endpoint
      )
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
      this.logger.warn(
        'api_health_check failed, reselecting',
        endpoint,
        health,
        reason
      )
      return await this.select(endpoint)
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

  private async reselectAndRetry({
    context,
    endpoint
  }: {
    context: ResponseContext | ErrorContext
    endpoint: string
  }): Promise<Response | undefined> {
    // On request failure, check health_check and reselect if unhealthy
    this.logger.warn('request failed', endpoint, context)
    const { health, data, reason } = await getDiscoveryNodeHealthCheck({
      endpoint,
      healthCheckThresholds: this.config.healthCheckThresholds
    })
    const newEndpoint = await this.reselectIfNecessary({
      endpoint,
      health,
      reason,
      data: {
        block_difference: data?.block_difference ?? 0,
        version: data?.version ?? ''
      }
    })
    if (newEndpoint && newEndpoint !== endpoint) {
      try {
        const path = getPathFromUrl(context.url)
        // Retry once on new endpoint
        return await context.fetch(`${newEndpoint}${path}`, context.init)
      } catch (e) {
        this.logger.error('Retry on new node failed', newEndpoint)
      }
    }
    return undefined
  }
}

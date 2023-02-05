import type TypedEventEmitter from 'typed-emitter'
import type { Middleware } from '../../api/generated/default'
import type { LocalStorage } from '../../utils/localStorage'
import type { HealthCheckThresholds } from './healthCheckTypes'

export type Decision = {
  stage: string
  val?: unknown
}

export enum DECISION_TREE_STATE {
  CHECK_SHORT_CIRCUIT = 'Check Short Circuit',
  GET_ALL_SERVICES = 'Get All Services',
  FILTER_TO_WHITELIST = 'Filter To Whitelist',
  FILTER_FROM_BLACKLIST = 'Filter From Blacklist',
  FILTER_OUT_KNOWN_UNHEALTHY = 'Filter Out Known Unhealthy',
  GET_SELECTION_ROUND = 'Get Selection Round',
  NO_SERVICES_LEFT_TO_TRY = 'No Services Left To Try',
  SELECTED_FROM_BACKUP = 'Selected From Backup',
  FAILED_AND_RESETTING = 'Failed Everything -- Resetting',
  ROUND_FAILED_RETRY = 'Round Failed Retry',
  MADE_A_SELECTION = 'Made A Selection',
  RACED_AND_FOUND_BEST = 'Raced And Found Best'
}

export type BackupHealthData = {
  block_difference: number
  version: string
}

export type DiscoveryNodeSelectorServiceConfigInternal = {
  /**
   * Services from this list should not be picked
   */
  blocklist: Set<string> | null
  /**
   * Only services from this list are allowed to be picked
   */
  allowlist: Set<string> | null
  /*
   * The maximum number of requests allowed to fire at
   * once. Tweaking this value may impact browser performance
   */
  maxConcurrentRequests: number
  /**
   * the timeout at which to give up on a service healthcheck
   */
  requestTimeout: number
  /*
   * the point at which the unhealthy services are freed so they
   * may be tried again (re-requested)
   */
  unhealthyTTL: number
  /*
   * the point at which backup services are freed so they may be
   * tried again (re-requested)
   */
  backupsTTL: number
  /**
   * How long the cache should live for selected nodes, in ms.
   * If unset, never expires.
   * @default 600000 ten minutes
   */
  cacheTTL: number | null
  /**
   * Injection for LocalStorage/AsyncStorage/Node-LocalStorage or some form of a persistent cache.
   * Can be used in order to shortcircuit selection for quicker load times.
   */
  localStorage: LocalStorage | null
  /**
   * Configuration for determining healthy status
   */
  healthCheckThresholds: HealthCheckThresholds
  /**
   * This should be a list of registered discovery nodes that can be used to
   * initialize the selection and get the current registered list from.
   * @example ['https://discoverynode.audius.co', 'https://disoverynode2.audius.co']
   */
  bootstrapServices: string[]
}

export type DiscoveryNodeSelectorServiceConfig =
  Partial<DiscoveryNodeSelectorServiceConfigInternal> & {
    /**
     * This should be a list of registered discovery nodes that can be used to
     * initialize the selection and get the current registered list from.
     * @example ['https://discoverynode.audius.co', 'https://disoverynode2.audius.co']
     */
    bootstrapServices: string[]
  }

export type ServiceSelectionEvents = {
  change: (endpoint: string) => void
}

export type DiscoveryNodeSelectorService = {
  getSelectedEndpoint: () => Promise<string>
  createMiddleware: () => Middleware
  addEventListener: TypedEventEmitter<ServiceSelectionEvents>['addListener']
  removeEventListener: TypedEventEmitter<ServiceSelectionEvents>['removeListener']
  removeAllEventListeners: TypedEventEmitter<ServiceSelectionEvents>['removeAllListeners']
}
